const express = require('express')
const { saveFilter, getFilters, updateFilterAlert } = require('../controllers/filterController')
const { authenticateToken } = require('../middleware/authMiddleware')

const router = express.Router()

// Protect the endpoints with authenticateToken middleware
router.post('/', authenticateToken, saveFilter)
router.get('/', authenticateToken, getFilters)
router.put('/:id/alert', authenticateToken, updateFilterAlert)

module.exports = router
