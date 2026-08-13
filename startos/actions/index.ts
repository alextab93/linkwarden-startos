import { configureAccess } from './configureAccess'
import { configureSmtp } from './configureSmtp'
import { setPrimaryDomain } from './setPrimaryUrl'
import { sdk } from '../sdk'

export const actions = sdk.Actions.of()
  .addAction(configureAccess)
  .addAction(setPrimaryDomain)
  .addAction(configureSmtp)
