import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.14.1:5',
  releaseNotes: {
    en_US: `Fixed PostgreSQL access after restore.
- Restored databases now accept password-authenticated connections from the StartOS service bridge.

Fixed persistent-file backup paths.
- Linkwarden files, the search index, and the StartOS secret store now restore to their correct locations.

Fixed restores whose backup does not contain the StartOS secret store.
- Restores now generate the required StartOS secrets and assign the generated PostgreSQL password.

Fixed PostgreSQL backup restores.
- Restores now reuse the PostgreSQL database created during initialization.

Improved primary domain configuration.
- Adds a Primary Domain selector using the URLs exposed by StartOS.
- The selected domain is used for Linkwarden's BASE_URL and NEXTAUTH_URL.
- Existing installations fall back to automatic domain selection when no primary domain has been configured.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
