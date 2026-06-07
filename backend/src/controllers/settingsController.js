const {
  getUserAiSettings,
  upsertUserAiSettings,
} = require('../services/userAiSettingsService')

/**
 * Returns the authenticated user's AI settings.
 *
 * @param {object} req Express request with authenticated user data.
 * @param {object} res Express response used to send the result.
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
const getAiSettings = async (req, res) => {
  try {
    const userId = req.user.userId
    const settings = await getUserAiSettings(userId)

    return res.status(200).json({
      settings: {
        model: settings.model,
        provider: settings.provider,
        useCustomApiKey: settings.useCustomApiKey,
        hasCustomApiKey: settings.hasCustomApiKey,
      },
    })
  } catch (error) {
    console.error('Error fetching AI settings:', error)
    return res.status(500).json({ message: 'Failed to fetch AI settings' })
  }
}

/**
 * Updates the authenticated user's AI settings.
 *
 * @param {object} req Express request with the settings payload in the body.
 * @param {object} res Express response used to send the result.
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
const updateAiSettings = async (req, res) => {
  try {
    const userId = req.user.userId

    const updated = await upsertUserAiSettings(userId, {
      model: req.body.model,
      provider: req.body.provider,
      useCustomApiKey: req.body.useCustomApiKey,
      apiKey: req.body.apiKey,
    })

    return res.status(200).json({
      message: 'AI settings saved successfully',
      settings: {
        model: updated.model,
        provider: updated.provider,
        useCustomApiKey: updated.useCustomApiKey,
        hasCustomApiKey: updated.hasCustomApiKey,
      },
    })
  } catch (error) {
    console.error('Error updating AI settings:', error)
    return res.status(500).json({ message: 'Failed to save AI settings' })
  }
}

module.exports = {
  getAiSettings,
  updateAiSettings,
}
