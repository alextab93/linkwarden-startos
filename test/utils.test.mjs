import assert from 'node:assert/strict'
import test from 'node:test'
import { selectCanonicalBase, smtpEnvironment } from '../startos/utils.ts'

test('selectCanonicalBase excludes local addresses and prioritizes onion origins', () => {
  assert.equal(
    selectCanonicalBase([
      'http://localhost:3000',
      'https://linkwarden.local',
      'https://192.168.1.5:3000',
      'http://exampleonionaddress.onion',
    ]),
    'http://exampleonionaddress.onion',
  )
})

test('smtpEnvironment encodes custom SMTP credentials and selects STARTTLS', () => {
  assert.deepEqual(
    smtpEnvironment({
      host: 'smtp.example.com',
      port: '587',
      username: 'user@example.com',
      password: 'p@ss:word',
      from: 'Linkwarden <sender@example.com>',
      security: 'starttls',
    }),
    {
      NEXT_PUBLIC_EMAIL_PROVIDER: 'true',
      EMAIL_FROM: 'Linkwarden <sender@example.com>',
      EMAIL_SERVER:
        'smtp://user%40example.com:p%40ss%3Aword@smtp.example.com:587',
    },
  )
})

test('smtpEnvironment omits SMTP credentials when email is disabled', () => {
  assert.deepEqual(smtpEnvironment(null), {
    NEXT_PUBLIC_EMAIL_PROVIDER: 'false',
  })
})

test('smtpEnvironment selects implicit TLS', () => {
  assert.equal(
    smtpEnvironment({
      host: 'smtp.example.com',
      port: '465',
      username: 'user',
      password: 'password',
      from: 'sender@example.com',
      security: 'tls',
    }).EMAIL_SERVER,
    'smtps://user:password@smtp.example.com:465',
  )
})
