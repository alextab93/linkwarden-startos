import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.14.1:1',
  releaseNotes: { en_US: 'Initial Linkwarden package release.' },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
