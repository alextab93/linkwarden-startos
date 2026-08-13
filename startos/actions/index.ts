import { configureAccess } from './configureAccess'
import { configureSmtp } from './configureSmtp'
import { sdk } from '../sdk'

export const actions = sdk.Actions.of()
  .addAction(configureAccess)
  .addAction(configureSmtp)
