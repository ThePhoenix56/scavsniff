const jwt = require('jsonwebtoken')

/**
 * Verifies the Bearer token and attaches the decoded user to the request.
 *
 * @param {object} req Express request containing the authorization header.
 * @param {object} res Express response used to report auth failures.
 * @param {import('express').NextFunction} next Express next function used to continue the request chain.
 * @returns {void}
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer Token format

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' })
  }

  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' })
    }

    // Attach the user payload to the request
    req.user = user

    return next()
  })
}

module.exports = {
  authenticateToken,
}
