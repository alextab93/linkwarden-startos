import { FileHelper, smtpShape, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  nextAuthSecret: z.string(),
  postgresPassword: z.string(),
  meiliMasterKey: z.string(),
  primaryDomain: z.string().optional().catch(undefined),
  registrationDisabled: z.boolean().catch(false),
  smtp: smtpShape,
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'startos/store.json' },
  shape,
)
