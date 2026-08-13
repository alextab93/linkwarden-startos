import { type T } from '@start9labs/start-sdk'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import {
  meilisearchHostId,
  meilisearchPort,
  postgresHostId,
  postgresPort,
  selectCanonicalBase,
  smtpEnvironment,
  getUiInterfaceUrls,
  uiPort,
} from './utils'

function toSmtpValue(
  value: T.SmtpValue | null,
): Parameters<typeof smtpEnvironment>[0] {
  if (!value) return null
  return {
    host: value.host,
    port: String(value.port),
    username: value.username,
    password: value.password,
    from: value.from,
    security: value.security,
  }
}

export const main = sdk.setupMain(async ({ effects }) => {
  const store = await storeJson.read((value) => value).const(effects)
  if (!store) throw new Error('Linkwarden has not been initialized.')

  const uiUrls = await getUiInterfaceUrls(effects)

  let baseUrl = ''

  if (store.primaryDomain) {
    try {
      baseUrl = new URL(store.primaryDomain).origin
    } catch {
      console.warn(
        `Invalid configured primary domain: ${store.primaryDomain}`,
      )
    }
  }

  if (!baseUrl) {
    baseUrl = selectCanonicalBase(uiUrls)
  }

  if (!baseUrl) {
    throw new Error(
      'Linkwarden has no non-local canonical interface address.',
    )
  }

  const postgresAddress = await sdk.host
    .getBridgeAddress(effects, {
      hostId: postgresHostId,
      internalPort: postgresPort,
    })
    .const()
  const meilisearchAddress = await sdk.host
    .getBridgeAddress(effects, {
      hostId: meilisearchHostId,
      internalPort: meilisearchPort,
    })
    .const()
  if (!postgresAddress || !meilisearchAddress) {
    throw new Error('Linkwarden internal service bindings are unavailable.')
  }

  let smtp: Parameters<typeof smtpEnvironment>[0] = null
  if (store.smtp.selection === 'system') {
    const systemSmtp = await sdk.getSystemSmtp(effects).const()
    if (systemSmtp) {
      smtp = toSmtpValue({
        ...systemSmtp,
        from: store.smtp.value.customFrom || systemSmtp.from,
      })
    }
  }
  if (store.smtp.selection === 'custom') {
    const provider = store.smtp.value.provider.value
    smtp = {
      host: provider.host,
      port: provider.security.value.port,
      username: provider.username,
      password: provider.password,
      from: provider.from,
      security: provider.security.selection,
    }
  }

  const postgres = sdk.SubContainer.of(
    effects,
    { imageId: 'postgres' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'postgres-data',
      mountpoint: '/var/lib/postgresql/data',
      readonly: false,
    }),
    'postgres',
  )
  const meilisearch = sdk.SubContainer.of(
    effects,
    { imageId: 'meilisearch' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'meili-data',
      mountpoint: '/meili_data',
      readonly: false,
    }),
    'meilisearch',
  )
  const linkwarden = sdk.SubContainer.of(
    effects,
    { imageId: 'linkwarden' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'linkwarden-data',
      mountpoint: '/data/data',
      readonly: false,
    }),
    'linkwarden',
  )

  return sdk.Daemons.of(effects)
    .addDaemon('postgres', {
      subcontainer: postgres,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          POSTGRES_USER: 'postgres',
          POSTGRES_DB: 'postgres',
          POSTGRES_PASSWORD: store.postgresPassword,
        },
      },
      ready: {
        display: 'PostgreSQL',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, postgresPort, {
            successMessage: 'PostgreSQL is ready',
            errorMessage: 'PostgreSQL is not ready',
          }),
      },
      requires: [],
    })
    .addDaemon('meilisearch', {
      subcontainer: meilisearch,
      exec: {
        command: sdk.useEntrypoint(),
        env: { MEILI_MASTER_KEY: store.meiliMasterKey },
      },
      ready: {
        display: 'Meilisearch',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, meilisearchPort, {
            successMessage: 'Meilisearch is ready',
            errorMessage: 'Meilisearch is not ready',
          }),
      },
      requires: [],
    })
    .addDaemon('linkwarden', {
      subcontainer: linkwarden,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          NEXTAUTH_SECRET: store.nextAuthSecret,
          NEXTAUTH_URL: `${baseUrl}/api/v1/auth`,
          BASE_URL: baseUrl,
          DATABASE_URL: `postgresql://postgres:${encodeURIComponent(store.postgresPassword)}@${postgresAddress}/postgres`,
          MEILI_HOST: `http://${meilisearchAddress}`,
          MEILI_MASTER_KEY: store.meiliMasterKey,
          STORAGE_FOLDER: 'data',
          NEXT_PUBLIC_DISABLE_REGISTRATION: String(store.registrationDisabled),
          NEXT_PUBLIC_CREDENTIALS_ENABLED: 'true',
          ALLOW_PRIVATE_NETWORK_ACCESS: 'false',
          ALLOW_INSECURE_TLS: 'false',
          ...smtpEnvironment(smtp),
        },
      },
      ready: {
        display: 'Linkwarden web interface',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: 'Linkwarden is ready',
            errorMessage: 'Linkwarden is not ready',
          }),
      },
      requires: ['postgres', 'meilisearch'],
    })
})
