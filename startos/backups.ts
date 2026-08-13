import { randomBytes } from 'node:crypto'
import { mountBackupTarget } from '@start9labs/start-sdk/lib/backup/Backups'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'

const postgresDatabase = 'postgres'
const postgresUser = 'postgres'
const postgresDataPath = '/var/lib/postgresql/postgres-data'
const postgresDumpPath = `/backup-target/${postgresDatabase}-db.dump`
const temporaryDumpPath = `/tmp/${postgresDatabase}-db.dump`

const secret = () => randomBytes(48).toString('base64url')

async function startPostgres(
  sub: Awaited<ReturnType<typeof sdk.SubContainer.eager>>,
) {
  await sub.execFail(
    ['pg_ctl', 'start', '-D', postgresDataPath, '-o', '-c listen_addresses='],
    { user: postgresUser },
  )

  for (let elapsed = 0; elapsed < 60_000; elapsed += 1000) {
    const { exitCode } = await sub.exec(['pg_isready', '-U', postgresUser], {
      user: postgresUser,
    })

    if (exitCode === 0) return
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error('PostgreSQL failed to become ready within 60 seconds')
}

export const { createBackup, restoreInit } = sdk.setupBackups(async () => {
  const backups = sdk.Backups.withPgDump({
    imageId: 'postgres',
    dbVolume: 'main',
    mountpoint: '/var/lib/postgresql',
    pgdataPath: '/postgres-data',
    database: postgresDatabase,
    user: postgresUser,
    password: async () =>
      (await storeJson.read((value) => value.postgresPassword).once()) ?? '',
  })
    .addSync({
      dataPath: '/media/startos/volumes/main/linkwarden-data/',
      backupPath: '/media/startos/backup/volumes/main/linkwarden-data/',
    })
    .addSync({
      dataPath: '/media/startos/volumes/main/meili-data/',
      backupPath: '/media/startos/backup/volumes/main/meili-data/',
    })
    .addSync({
      dataPath: '/media/startos/volumes/main/startos/',
      backupPath: '/media/startos/backup/volumes/main/startos/',
    })

  return backups.setPostRestore(async (effects) => {
    let store = await storeJson.read((value) => value).once()

    if (!store) {
      store = {
        nextAuthSecret: secret(),
        postgresPassword: secret(),
        meiliMasterKey: secret(),
        registrationDisabled: false,
        smtp: { selection: 'disabled', value: {} },
      }
      await storeJson.write(effects, store)
    }

    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'postgres' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        mountpoint: '/var/lib/postgresql',
        readonly: false,
        subpath: null,
      }),
      'pg-restore',
      async (sub) => {
        await mountBackupTarget(sub.rootfs)
        await sub.execFail(['cp', postgresDumpPath, temporaryDumpPath], {
          user: 'root',
        })
        await sub.execFail(['chown', 'postgres:postgres', temporaryDumpPath], {
          user: 'root',
        })
        await sub.execFail(
          ['chown', '-R', 'postgres:postgres', '/var/lib/postgresql'],
          {
            user: 'root',
          },
        )
        await sub.execFail(
          ['initdb', '-D', postgresDataPath, '-U', postgresUser],
          { user: postgresUser },
        )
        await sub.execFail(
          [
            'sh',
            '-c',
            `printf '%s\n' 'host all all all scram-sha-256' >> '${postgresDataPath}/pg_hba.conf'`,
          ],
          { user: postgresUser },
        )
        await startPostgres(sub)

        const database = await sub.exec(
          [
            'psql',
            '-U',
            postgresUser,
            '-tAc',
            `SELECT 1 FROM pg_database WHERE datname = '${postgresDatabase}'`,
          ],
          { user: postgresUser },
        )

        if (database.exitCode !== 0) database.throw()

        if (database.stdout.toString().trim() !== '1') {
          await sub.execFail(
            ['createdb', '-U', postgresUser, postgresDatabase],
            {
              user: postgresUser,
            },
          )
        }

        await sub.execFail(
          [
            'pg_restore',
            '-U',
            postgresUser,
            '-d',
            postgresDatabase,
            '--no-owner',
            '--no-privileges',
            temporaryDumpPath,
          ],
          { user: postgresUser },
          null,
        )
        await sub.execFail(
          [
            'psql',
            '-U',
            postgresUser,
            '-d',
            postgresDatabase,
            '-c',
            `ALTER USER ${postgresUser} WITH PASSWORD '${store.postgresPassword}'`,
          ],
          { user: postgresUser },
        )
        await sub.execFail(['pg_ctl', 'stop', '-D', postgresDataPath, '-w'], {
          user: postgresUser,
        })
      },
    )
  })
})
