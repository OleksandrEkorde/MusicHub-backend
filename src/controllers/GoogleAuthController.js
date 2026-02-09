
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import db from '../db/drizzle.js'
import { users } from '../db/schema.js'

const requiredEnv = name => {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not configured`)
  return v
}

const buildGoogleAuthUrl = () => {
  const clientId = requiredEnv('GOOGLE_CLIENT_ID')
  const redirectUri = requiredEnv('GOOGLE_REDIRECT_URI')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

const exchangeCodeForTokens = async code => {
  const clientId = requiredEnv('GOOGLE_CLIENT_ID')
  const clientSecret = requiredEnv('GOOGLE_CLIENT_SECRET')
  const redirectUri = requiredEnv('GOOGLE_REDIRECT_URI')

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Google token exchange failed: ${resp.status} ${text}`)
  }

  return resp.json()
}

const fetchGoogleUserInfo = async accessToken => {
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Google userinfo failed: ${resp.status} ${text}`)
  }

  return resp.json()
}

const signAccessToken = user => {
  const secret = requiredEnv('JWT_SECRET')
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role ?? null,
    },
    secret,
    { expiresIn },
  )
}

const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production'

  const parts = [
    `access_token=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${60 * 60 * 24 * 7}`,
    `SameSite=${isProd ? 'None' : 'Lax'}`,
  ]

  if (isProd) parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

const toRedirectUrl = token => {
  const base = process.env.FRONTEND_URL
  if (!base) return null
  return base
}

const randomPassword = () => {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID()
  const s = Math.random().toString(36).slice(2)
  const t = Date.now().toString(36)
  return `${s}${t}`
}

export default class GoogleAuthController {
  static async redirect(req, res) {
    try {
      return res.redirect(buildGoogleAuthUrl())
    } catch (err) {
      console.error(err)
      return res.status(500).json({ status: 'error', message: 'Error' })
    }
  }

  static async callback(req, res) {
    try {
      const code = typeof req.query.code === 'string' ? req.query.code : ''
      if (!code) return res.status(400).json({ status: 'error', message: 'code is required' })

      const tokens = await exchangeCodeForTokens(code)
      const accessToken = tokens?.access_token
      if (!accessToken) return res.status(400).json({ status: 'error', message: 'Invalid token response from Google' })

      const info = await fetchGoogleUserInfo(accessToken)
      const email = typeof info?.email === 'string' ? info.email.trim().toLowerCase() : ''
      if (!email) return res.status(400).json({ status: 'error', message: 'Google account has no email' })

      const firstNameRaw = typeof info?.given_name === 'string' ? info.given_name.trim() : ''
      const lastNameRaw = typeof info?.family_name === 'string' ? info.family_name.trim() : ''
      const firstName = firstNameRaw || ''
      const lastName = lastNameRaw || ''

      const existing = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      let user = existing?.[0] ?? null

      if (!user) {
        const passwordHash = await bcrypt.hash(randomPassword(), 10)
        const inserted = await db
          .insert(users)
          .values({
            email,
            password: passwordHash,
            firstName,
            lastName,
            createdAt: new Date(),
          })
          .returning({
            id: users.id,
            email: users.email,
            role: users.role,
            firstName: users.firstName,
            lastName: users.lastName,
          })

        user = inserted?.[0] ?? null
      } else {
        const shouldUpdateName = (!user.firstName && firstName) || (!user.lastName && lastName)
        if (shouldUpdateName) {
          const updated = await db
            .update(users)
            .set({
              firstName: (user.firstName ?? '').trim() ? user.firstName : firstName,
              lastName: (user.lastName ?? '').trim() ? user.lastName : lastName,
            })
            .where(eq(users.id, user.id))
            .returning({
              id: users.id,
              email: users.email,
              role: users.role,
              firstName: users.firstName,
              lastName: users.lastName,
            })

          user = updated?.[0] ?? user
        }
      }

      if (!user?.id) return res.status(500).json({ status: 'error', message: 'Failed to create user' })

      const token = signAccessToken(user)
      setAuthCookie(res, token)
      const redirectUrl = toRedirectUrl(token)
      if (redirectUrl) return res.redirect(redirectUrl)

      return res.json({ token, user })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ status: 'error', message: 'Error' })
    }
  }
}
