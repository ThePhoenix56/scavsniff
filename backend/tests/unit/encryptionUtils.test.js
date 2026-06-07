const test = require('node:test')
const assert = require('node:assert/strict')

process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef'

const { decryptApiKey, encryptApiKey } = require('../../src/utils/encryptionUtils')

test('encryptApiKey and decryptApiKey round-trip a value', () => {
  const secret = 'unit-test-secret'
  const encryptedSecret = encryptApiKey(secret)

  assert.notEqual(encryptedSecret, secret)
  assert.equal(decryptApiKey(encryptedSecret), secret)
})

test('decryptApiKey returns null for invalid input', () => {
  const originalConsoleError = console.error

  console.error = function () {}

  try {
    assert.equal(decryptApiKey('not-a-valid-encrypted-value'), null)
  } finally {
    console.error = originalConsoleError
  }
})
