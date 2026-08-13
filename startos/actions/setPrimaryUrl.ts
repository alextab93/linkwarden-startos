import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import {
  getUiInterfaceUrls,
  selectCanonicalBase,
} from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  domain: Value.dynamicSelect(async ({ effects }) => {
    const urls = await getUiInterfaceUrls(effects)

    return {
      name: 'Primary Domain',
      values: urls.reduce(
        (values, url) => ({
          ...values,
          [url]: url,
        }),
        {} as Record<string, string>,
      ),
      default: '',
    }
  }),
})

export const setPrimaryDomain = sdk.Action.withInput(
  'set-primary-domain',
  async () => ({
    name: 'Set Primary Domain',
    description:
      'Choose which Linkwarden URL should be used for authentication, links, email verification, and other externally generated URLs.',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => {
    const stored = await storeJson
      .read((store) => store.primaryDomain)
      .const(effects)
    if (stored) {
      return {
        domain: stored,
      }
    }
    const urls = await getUiInterfaceUrls(effects)
    return {
      domain: selectCanonicalBase(urls) || undefined,
    }
  },
  async ({ effects, input }) =>
    storeJson.merge(effects, {
      primaryDomain: input.domain,
    }),
)