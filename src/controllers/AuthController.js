
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

const normalizeEmail = value => {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
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

const clearAuthCookie = res => {
  const isProd = process.env.NODE_ENV === 'production'

  const parts = [
    'access_token=',
    'HttpOnly',
    'Path=/',
    'Max-Age=0',
    `SameSite=${isProd ? 'None' : 'Lax'}`,
  ]

  if (isProd) parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
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

export default class AuthController {
  static async register(req, res) {
    try {
      const email = normalizeEmail(req.body?.email)
      const password = typeof req.body?.password === 'string' ? req.body.password : ''

      const firstName = typeof req.body?.firstName === 'string' ? req.body.firstName.trim() : ''
      const lastName = typeof req.body?.lastName === 'string' ? req.body.lastName.trim() : ''

      if (!email) return res.status(400).json({ status: 'error', message: 'email is required' })
      if (!password || password.length < 6) {
        return res.status(400).json({ status: 'error', message: 'password must be at least 6 characters' })
      }

      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (existing.length > 0) {
        return res.status(409).json({ status: 'error', message: 'User already exists' })
      }

      const passwordHash = await bcrypt.hash(password, 10)

      const inserted = await db
        .insert(users)
        .values({
          email,
          password: passwordHash,
          firstName: firstName || '',
          lastName: lastName || '',
          createdAt: new Date(),
        })
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
          bio: users.bio,
          createdAt: users.createdAt,
        })

      const user = inserted?.[0] ?? null
      if (!user?.id) return res.status(500).json({ status: 'error', message: 'Failed to create user' })

      const token = signAccessToken(user)
      setAuthCookie(res, token)
      return res.status(201).json({ token, user })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ status: 'error', message: 'Error' })
    }
  }

  static async login(req, res) {
    try {
      const email = normalizeEmail(req.body?.email)
      const password = typeof req.body?.password === 'string' ? req.body.password : ''

      if (!email) return res.status(400).json({ status: 'error', message: 'email is required' })
      if (!password) return res.status(400).json({ status: 'error', message: 'password is required' })

      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          password: users.password,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
          bio: users.bio,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      const u = rows?.[0] ?? null
      if (!u?.id || !u?.password) {
        return res.status(401).json({ status: 'error', message: 'Invalid credentials' })
      }

      const ok = await bcrypt.compare(password, u.password)
      if (!ok) return res.status(401).json({ status: 'error', message: 'Invalid credentials' })

      const user = {
        id: u.id,
        email: u.email,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        bio: u.bio,
        createdAt: u.createdAt,
      }

      const token = signAccessToken(user)
      setAuthCookie(res, token)
      return res.json({ token, user })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ status: 'error', message: 'Error' })
    }
  }

  static async logout(req, res) {
    try {
      clearAuthCookie(res)
      return res.json({ status: 'success', message: 'Logged out' })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ status: 'error', message: 'Error' })
    }
  }
}
