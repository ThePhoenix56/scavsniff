const express = require('express')
const { authenticateToken } = require('../middleware/authMiddleware')
const { getAiSettings, updateAiSettings } = require('../controllers/settingsController')

const router = express.Router()

router.get('/ai', authenticateToken, getAiSettings)
router.put('/ai', authenticateToken, updateAiSettings)

module.exports = router
