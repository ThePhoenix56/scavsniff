const { getRecentBestDeals } = require('../services/recentBestDealsService')

/**
 * Returns the latest best deals stored by the backend.
 *
 * @param {object} _req Express request
 * @param {object} res Express response used to send the result
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
const fetchRecentBestDeals = async (_req, res) => {
  try {
    const deals = await getRecentBestDeals(3)
    return res.status(200).json({ deals })
  } catch (error) {
    console.error('Error fetching recent best deals:', error)
    return res.status(500).json({ message: 'Failed to fetch recent best deals' })
  }
}

module.exports = {
  fetchRecentBestDeals,
}
