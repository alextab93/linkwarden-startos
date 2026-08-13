import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'

export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.withPgDump({
    imageId: 'postgres',
    dbVolume: 'main',
    mountpoint: '/var/lib/postgresql',
    pgdataPath: '/postgres-data',
    database: 'postgres',
    user: 'postgres',
    password: async () =>
      (await storeJson.read((value) => value.postgresPassword).once()) ?? '',
  })
    .addSync({
      dataPath: '/media/startos/volumes/main/linkwarden-data',
      backupPath: '/media/startos/backup/volumes/main/linkwarden-data',
    })
    .addSync({
      dataPath: '/media/startos/volumes/main/meili-data',
      backupPath: '/media/startos/backup/volumes/main/meili-data',
    })
    .addSync({
      dataPath: '/media/startos/volumes/main/startos',
      backupPath: '/media/startos/backup/volumes/main/startos',
    }),
)
