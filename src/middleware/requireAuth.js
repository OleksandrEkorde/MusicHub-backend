import jwt from 'jsonwebtoken'

import { sendError } from '../utils/sendError.js'

const parseCookies = cookieHeader => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {}
  return cookieHeader
    .split(';')
    .map(v => v.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const idx = part.indexOf('=')
      if (idx === -1) return acc
      const k = part.slice(0, idx)
      const val = part.slice(idx + 1)
      acc[k] = decodeURIComponent(val)
      return acc
    }, {})
}

const getTokenFromRequest = req => {
  const header = req.headers.authorization
  if (header && typeof header === 'string') {
    const [scheme, headerToken] = header.split(' ')
    if (scheme === 'Bearer' && headerToken) return headerToken
  }

  const cookies = parseCookies(req.headers.cookie)
  if (cookies.access_token) return cookies.access_token

  return null
}

export default function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return sendError(res, 401, 'Unauthorized')

    const secret = process.env.JWT_SECRET
    if (!secret) return sendError(res, 500, 'JWT_SECRET is not configured')

    const payload = jwt.verify(token, secret)
    req.user = payload
    return next()
  } catch {
    return sendError(res, 401, 'Unauthorized')
  }
}
