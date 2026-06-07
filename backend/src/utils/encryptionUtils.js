const crypto = require('crypto')

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const IV_LENGTH = 16

/**
 * Resolves the configured encryption key into a 32 byte buffer.
 *
 * @returns {Buffer} Encryption key buffer.
 */
function resolveEncryptionKeyBuffer() {
  const raw = (ENCRYPTION_KEY || '').trim()

  if (/^[0-9a-f]{64}$/i.test(raw)) {
    return Buffer.from(raw, 'hex')
  }

  const base64Key = Buffer.from(raw, 'base64')
  if (base64Key.length === 32) {
    return base64Key
  }

  return crypto.createHash('sha256').update(raw).digest()
}

const ENCRYPTION_KEY_BUFFER = resolveEncryptionKeyBuffer()

/**
 * Encrypts plaintext with the shared API key cipher.
 *
 * @param {string} text The value to encrypt.
 * @returns {string} The encrypted value.
 */
function encryptApiKey(text) {
  if (!text) return text
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY_BUFFER, iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

/**
 * Decrypts an encrypted API key payload.
 *
 * @param {string} text Encrypted text to decrypt.
 * @returns {string|null} The decrypted value or null if decryption fails.
 */
function decryptApiKey(text) {
  if (!text) return text
  try {
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift(), 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY_BUFFER, iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  } catch (error) {
    console.error('Failed to decrypt API key:', error)
    return null
  }
}

module.exports = { encryptApiKey, decryptApiKey }
