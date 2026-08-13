# Linkwarden for StartOS

Linkwarden is a collaborative bookmark manager that archives web pages and makes preserved content searchable.

The package runs Linkwarden v2.14.1 with PostgreSQL 16 and Meilisearch v1.12.8. Only the Linkwarden web interface is exported. PostgreSQL and Meilisearch are reachable only through StartOS bridge-only bindings.

Persistent state is stored in the `main` volume:

- `linkwarden-data` contains archives and uploads.
- `postgres-data` contains application data.
- `meili-data` contains the search index.
- `startos/store.json` contains StartOS-managed secrets and settings.

On installation, the package generates the NextAuth secret, PostgreSQL password, and Meilisearch master key. Registration is enabled initially. Configure registration and SMTP with the StartOS actions.

The canonical URL is selected deterministically from non-local StartOS UI addresses: onion address, domain name, IPv4, then IPv6. Values within a class are sorted lexicographically. This address is used for `BASE_URL` and `NEXTAUTH_URL`.

Private-network archiving and insecure TLS are permanently disabled in this MVP.

## Hardware requirements

StartOS enforces a minimum of 4 GB RAM. Allocate 8 GB RAM for a responsive experience while actively archiving pages, because Linkwarden runs Node.js, Chromium and Playwright alongside PostgreSQL and Meilisearch. Large imports and concurrent archival jobs benefit from additional memory.

## Build

Run `npm ci`, `npm run check`, `npm run build`, then `make` on a machine with the StartOS packaging prerequisites.
