const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const dealRoutes = require('./routes/dealRoutes')
const filterRoutes = require('./routes/filterRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const { startBackgroundJobs } = require('./services/backgroundJobScheduler')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/deals', dealRoutes)
app.use('/api/filters', filterRoutes)
app.use('/api/settings', settingsRoutes)

// base route for testing
app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to ScavSniff API' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  // Initialize background jobs
  startBackgroundJobs()
})
