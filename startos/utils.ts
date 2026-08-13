import { type T } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 3000
export const postgresPort = 5432
export const meilisearchPort = 7700
export const uiHostId = 'ui'
export const postgresHostId = 'postgres'
export const meilisearchHostId = 'meilisearch'

export function selectCanonicalBase(urls: string[]): string {
  const parsed = urls
    .map((value) => {
      try {
        return new URL(value).origin
      } catch {
        return null
      }
    })
    .filter((value): value is string => value !== null)
    .filter((value) => {
      const hostname = new URL(value).hostname
      return (
        hostname !== 'localhost' &&
        hostname !== '127.0.0.1' &&
        hostname !== '::1'
      )
    })
  const priority = (value: string) => {
    const hostname = new URL(value).hostname
    if (hostname.endsWith('.onion')) return 0
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) && !hostname.includes(':'))
      return 1
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return 2
    return 3
  }
  return (
    parsed.sort(
      (left, right) =>
        priority(left) - priority(right) || left.localeCompare(right),
    )[0] ?? ''
  )
}

function extractEmailAddress(from: string): string {
  const match = from.match(/<([^<>]+)>/)
  return (match?.[1] ?? from).trim()
}

export function getUiInterfaceUrls(effects: T.Effects): Promise<string[]> {
  return sdk.host
    .getOwn(effects, uiHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((binding) => Object.values(binding.interfaces))
          .find((iface) => iface.id === uiHostId)

      return iface ? iface.addressInfo.nonLocal.format() : []
    })
    .const()
}

export function smtpEnvironment(
  smtp: {
    host: string
    port: string
    username: string
    password: string | null | undefined
    from: string
    security: 'tls' | 'starttls'
  } | null,
): Record<string, string> {
  if (!smtp) return { NEXT_PUBLIC_EMAIL_PROVIDER: 'false' }
  const scheme = smtp.security === 'tls' ? 'smtps' : 'smtp'
  const authentication = `${encodeURIComponent(smtp.username)}:${encodeURIComponent(smtp.password ?? '')}`
  return {
    NEXT_PUBLIC_EMAIL_PROVIDER: 'true',
    EMAIL_FROM: extractEmailAddress(smtp.from),
    EMAIL_SERVER: `${scheme}://${authentication}@${smtp.host}:${smtp.port}`,
  }
}
