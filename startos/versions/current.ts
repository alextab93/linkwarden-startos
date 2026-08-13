import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.14.1:2',
  releaseNotes: {
    en_US: `Improved primary domain configuration.
- Adds a Primary Domain selector using the URLs exposed by StartOS.
- The selected domain is used for Linkwarden's BASE_URL and NEXTAUTH_URL.
- Existing installations fall back to automatic domain selection when no primary domain has been configured.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
