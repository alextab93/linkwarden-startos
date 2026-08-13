import { sdk } from './sdk'
import {
  meilisearchHostId,
  meilisearchPort,
  postgresHostId,
  postgresPort,
  uiHostId,
  uiPort,
} from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  await sdk.MultiHost.of(effects, postgresHostId).bindPort(postgresPort, {
    protocol: null,
    preferredExternalPort: postgresPort,
    addSsl: null,
    secure: { ssl: false },
  })
  await sdk.MultiHost.of(effects, meilisearchHostId).bindPort(meilisearchPort, {
    protocol: null,
    preferredExternalPort: meilisearchPort,
    addSsl: null,
    secure: { ssl: false },
  })
  const uiOrigin = await sdk.MultiHost.of(effects, uiHostId).bindPort(uiPort, {
    protocol: 'http',
    preferredExternalPort: uiPort,
  })
  const ui = sdk.createInterface(effects, {
    name: 'Web UI',
    id: 'ui',
    description: 'The Linkwarden web interface',
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  return [await uiOrigin.export([ui])]
})
