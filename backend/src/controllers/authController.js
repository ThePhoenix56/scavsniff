// src/controllers/authController.js
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../config/db')

/**
 * Registers a new user and returns a JWT.
 *
 * @param {object} req Express request with `username`, `email`, and `password` in the body.
 * @param {object} res Express response used to send the result.
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
const registerUser = async (req, res) => {
  const { username, email, password } = req.body

  try {
    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ? OR username = ?', [email, username])
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email or username already exists' })
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Insert into DB
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    )

    // Generate JWT
    const token = jwt.sign(
      { userId: result.insertId, username, email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    )

    return res.status(201).json({ message: 'User created successfully', token })
  } catch (error) {
    console.error('Registration Error:', error)
    return res.status(500).json({ message: 'Server error during registration.', error: error.message })
  }
}

/**
 * Logs in an existing user and returns a JWT.
 *
 * @param {object} req Express request with `email` and `password` in the body.
 * @param {object} res Express response used to send the result.
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    // Find user by email
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const user = users[0]

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    )

    return res.status(200).json({ message: 'Login successful', token, user: { id: user.id, username: user.username, email: user.email } })
  } catch (error) {
    console.error('Login Error:', error)
    return res.status(500).json({ message: 'Server error during login.', error: error.message })
  }
}

module.exports = {
  registerUser,
  loginUser,
}
