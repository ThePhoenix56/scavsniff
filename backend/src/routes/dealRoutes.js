const express = require('express')
const { fetchCarDeals, fetchEverythingDeals } = require('../controllers/dealController')
const { fetchRecentBestDeals } = require('../controllers/recentBestDealsController')
const { authenticateToken } = require('../middleware/authMiddleware')

const router = express.Router()

// Protect the endpoint with authenticateToken middleware
router.get('/search/car', authenticateToken, fetchCarDeals)
router.get('/search/everything', authenticateToken, fetchEverythingDeals)
router.get('/recent-best-deals', fetchRecentBestDeals)

module.exports = router
