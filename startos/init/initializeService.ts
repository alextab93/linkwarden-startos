import { randomBytes } from 'node:crypto'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

const secret = () => randomBytes(48).toString('base64url')

export const initializeService = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return
  await storeJson.write(effects, {
    nextAuthSecret: secret(),
    postgresPassword: secret(),
    meiliMasterKey: secret(),
    registrationDisabled: false,
    smtp: { selection: 'disabled', value: {} },
  })
})
