import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  allowRegistration: Value.toggle({
    name: 'Allow new user registration',
    description: 'Allow people to create new Linkwarden accounts.',
    default: true,
  }),
})

export const configureAccess = sdk.Action.withInput(
  'configure-access',
  async () => ({
    name: 'Configure Access',
    description: 'Configure whether new users can register.',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => ({
    allowRegistration: !(await storeJson
      .read((store) => store.registrationDisabled)
      .const(effects)),
  }),
  async ({ effects, input }) =>
    storeJson.merge(effects, {
      registrationDisabled: !input.allowRegistration,
    }),
)
