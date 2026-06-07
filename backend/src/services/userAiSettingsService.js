const db = require('../config/db')
const { encryptApiKey, decryptApiKey } = require('../utils/encryptionUtils')

let tableEnsured = false

const DEFAULT_MODEL = 'gpt-5.4-mini'
const DEFAULT_PROVIDER = 'openai'

const ALLOWED_PROVIDERS = new Set(['openai', 'anthropic', 'google', 'other'])

/**
 * Creates the user AI settings table if it doesn't exist in the database.
 *
 * @returns {Promise<void>} Resolves when the table has been ensured.
 */
async function ensureUserAiSettingsTable() {
  if (tableEnsured) return

  await db.execute(
    `CREATE TABLE IF NOT EXISTS user_ai_settings (
      user_id INT NOT NULL PRIMARY KEY,
      ai_model VARCHAR(120) NOT NULL DEFAULT '${DEFAULT_MODEL}',
      ai_provider VARCHAR(40) NOT NULL DEFAULT '${DEFAULT_PROVIDER}',
      use_custom_api_key TINYINT(1) NOT NULL DEFAULT 0,
      encrypted_api_key TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  )

  tableEnsured = true
}

/**
 * Normalizes the AI model value stored for a user.
 *
 * @param {string} value Candidate model name.
 * @returns {string} A safe model name.
 */
function normalizeModel(value) {
  if (typeof value !== 'string') return DEFAULT_MODEL
  const cleaned = value.trim()
  return cleaned.length > 0 ? cleaned : DEFAULT_MODEL
}

/**
 * Normalizes the AI provider value stored for a user.
 *
 * @param {string} value Candidate provider name.
 * @returns {string} A safe provider name.
 */
function normalizeProvider(value) {
  if (typeof value !== 'string') return DEFAULT_PROVIDER
  const cleaned = value.trim().toLowerCase()
  if (!ALLOWED_PROVIDERS.has(cleaned)) return DEFAULT_PROVIDER
  return cleaned
}

/**
 * Loads the current AI settings for a user.
 *
 * @param {number|string} userId User id to look up.
 * @returns {Promise<object>} The current settings payload.
 */
async function getUserAiSettings(userId) {
  await ensureUserAiSettingsTable()

  const [rows] = await db.execute(
    'SELECT ai_model, ai_provider, use_custom_api_key, encrypted_api_key FROM user_ai_settings WHERE user_id = ?',
    [userId]
  )

  if (rows.length === 0) {
    return {
      model: DEFAULT_MODEL,
      provider: DEFAULT_PROVIDER,
      useCustomApiKey: false,
      hasCustomApiKey: false,
      apiKey: null,
    }
  }

  const row = rows[0]
  const useCustomApiKey = row.use_custom_api_key === 1 || row.use_custom_api_key === true
  const hasCustomApiKey = Boolean(row.encrypted_api_key)

  return {
    model: row.ai_model || DEFAULT_MODEL,
    provider: row.ai_provider || DEFAULT_PROVIDER,
    useCustomApiKey,
    hasCustomApiKey,
    apiKey: hasCustomApiKey ? decryptApiKey(row.encrypted_api_key) : null,
  }
}

/**
 * Inserts or updates the AI settings for a user.
 *
 * @param {number|string} userId User id to update.
 * @param {object} payload New settings payload.
 * @returns {Promise<object>} The saved settings.
 */
async function upsertUserAiSettings(userId, payload) {
  await ensureUserAiSettingsTable()

  const model = normalizeModel(payload.model)
  const provider = normalizeProvider(payload.provider)
  const useCustomApiKey = payload.useCustomApiKey === true
  const newApiKey = typeof payload.apiKey === 'string' ? payload.apiKey.trim() : ''

  const [existingRows] = await db.execute(
    'SELECT encrypted_api_key FROM user_ai_settings WHERE user_id = ?',
    [userId]
  )

  let encryptedApiKey = null

  if (useCustomApiKey) {
    if (newApiKey.length > 0) {
      encryptedApiKey = encryptApiKey(newApiKey)
    } else if (existingRows.length > 0) {
      encryptedApiKey = existingRows[0].encrypted_api_key
    }
  }

  await db.execute(
    `INSERT INTO user_ai_settings (user_id, ai_model, ai_provider, use_custom_api_key, encrypted_api_key)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       ai_model = VALUES(ai_model),
       ai_provider = VALUES(ai_provider),
       use_custom_api_key = VALUES(use_custom_api_key),
       encrypted_api_key = VALUES(encrypted_api_key)`,
    [userId, model, provider, useCustomApiKey, encryptedApiKey]
  )

  return getUserAiSettings(userId)
}

module.exports = {
  ensureUserAiSettingsTable,
  getUserAiSettings,
  upsertUserAiSettings,
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
}
