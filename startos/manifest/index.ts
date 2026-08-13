import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'linkwarden',
  title: 'Linkwarden',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/alextab93/linkwarden-startos',
  upstreamRepo: 'https://github.com/linkwarden/linkwarden',
  marketingUrl: 'https://linkwarden.app/',
  donationUrl: null,
  hardwareRequirements: { ram: 4096 },
  description: { short, long },
  volumes: ['main'],
  images: {
    linkwarden: {
      source: { dockerTag: 'ghcr.io/linkwarden/linkwarden:v2.14.1' },
      arch: ['x86_64', 'aarch64'],
    },
    postgres: {
      source: { dockerTag: 'postgres:16-alpine' },
      arch: ['x86_64', 'aarch64'],
    },
    meilisearch: {
      source: { dockerTag: 'getmeili/meilisearch:v1.12.8' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
