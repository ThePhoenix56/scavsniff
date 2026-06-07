const db = require('../config/db')

/**
 * Saves a filter for the authenticated user.
 *
 * @param {object} req Express request with filter data in the body.
 * @param {object} res Express response used to send the result.
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
const saveFilter = async (req, res) => {
  try {
    const {
      filter_name,
      query_params,
      is_alert_active,
      alert_interval,
      notify_method,
      notify_target,
    } = req.body
    const userId = req.user.userId

    if (!filter_name || !query_params) {
      return res.status(400).json({ message: 'Filter name and search parameters are required.' })
    }

    const alertActive = is_alert_active || false
    const interval = alert_interval || 30 // Minimum 30 mins, more than 1 api request per 30 mins is not allowed (rate limit)
    const method = notify_method || 'none'
    const target = notify_target || null

    const [result] = await db.execute(
      'INSERT INTO saved_filters (user_id, filter_name, query_params, is_alert_active, alert_interval, notify_method, notify_target) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, filter_name, JSON.stringify(query_params), alertActive, interval, method, target]
    )

    return res.status(201).json({ message: 'Filter saved successfully', filterId: result.insertId })
  } catch (error) {
    console.error('Error saving filter:', error)
    return res.status(500).json({ message: 'Failed to save filter', error: error.message })
  }
}

/**
 * Returns the saved filters for the authenticated user.
 *
 * @param {object} req Express request with authenticated user data.
 * @param {object} res Express response used to send the result.
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
const getFilters = async (req, res) => {
  try {
    const userId = req.user.userId

    const [filters] = await db.execute(
      'SELECT id, filter_name, query_params, created_at, is_alert_active, alert_interval, notify_method, notify_target, last_checked_at FROM saved_filters WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )

    return res.status(200).json({ filters })
  } catch (error) {
    console.error('Error fetching filters:', error)
    return res.status(500).json({ message: 'Failed to fetch filters', error: error.message })
  }
}

/**
 * Updates the alert configuration for an existing filter.
 *
 * @param {object} req Express request with the filter id in params and new alert values in the body.
 * @param {object} res Express response used to send the result.
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
const updateFilterAlert = async (req, res) => {
  try {
    const filterId = req.params.id
    const userId = req.user.userId
    const { is_alert_active, alert_interval, notify_method, notify_target } = req.body

    const [result] = await db.execute(
      `UPDATE saved_filters
       SET is_alert_active = ?, alert_interval = ?, notify_method = ?, notify_target = ?
       WHERE id = ? AND user_id = ?`,
      [is_alert_active, alert_interval, notify_method, notify_target, filterId, userId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Filter not found or unauthorized' })
    }

    return res.status(200).json({ message: 'Alert configuration updated successfully' })
  } catch (error) {
    console.error('Error updating filter alert:', error)
    return res.status(500).json({ message: 'Failed to update alert', error: error.message })
  }
}

module.exports = {
  saveFilter,
  getFilters,
  updateFilterAlert,
}
