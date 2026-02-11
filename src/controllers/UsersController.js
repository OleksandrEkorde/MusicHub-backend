
import { v2 as cloudinary } from 'cloudinary'
import { eq } from 'drizzle-orm'
import multer from 'multer'
import db from '../db/drizzle.js'
import { users } from '../db/schema.js'

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const upload = multer({ storage: multer.memoryStorage() })

const ensureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured')
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })
}

const uploadAvatarBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
    stream.end(buffer)
  })

export default class UsersController {
  static uploadAvatarMiddleware = (req, res, next) => {
    if (!req.is('multipart/form-data')) return next()
    return upload.single('avatar')(req, res, next)
  }

  static async me(req, res) {
    try {
      const id = req.user?.id
      if (!id) return res.status(401).json({ status: 'error', message: 'Unauthorized' })

      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
          bio: users.bio,
          avatar: users.avatar,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1)

      if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' })
      return res.json({ data: rows[0] })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ status: 'error', message: 'Error' })
    }
  }

  static async getById(req, res) {
    try {
      const id = toPositiveInt(req.params.id, null)
      if (!id) return res.status(400).json({ status: 'error', message: 'Invalid id' })

      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
          bio: users.bio,
          avatar: users.avatar,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1)

      if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' })
      return res.json({ data: rows[0] })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ status: 'error', message: 'Error' })
    }
  }

  static async updateMe(req, res) {
    try {
      const id = req.user?.id
      if (!id) return res.status(401).json({ status: 'error', message: 'Unauthorized' })

      const firstName = typeof req.body?.firstName === 'string' ? req.body.firstName.trim() : ''
      const lastName = typeof req.body?.lastName === 'string' ? req.body.lastName.trim() : ''
      const bio = typeof req.body?.bio === 'string' ? req.body.bio.trim() : ''

      const currentRows = await db
        .select({
          avatarPublicId: users.avatarPublicId,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1)

      if (currentRows.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' })

      const updateData = {
        firstName,
        lastName,
        bio,
      }

      const avatarFile = req.file ?? null
      if (avatarFile?.buffer) {
        ensureCloudinary()

        const uploaded = await uploadAvatarBuffer(avatarFile.buffer, {
          resource_type: 'image',
          folder: 'musichub/users/avatar',
        })

        updateData.avatar = uploaded?.secure_url ?? null
        updateData.avatarPublicId = uploaded?.public_id ?? null

        const oldPublicId = currentRows[0]?.avatarPublicId
        if (oldPublicId && updateData.avatarPublicId && oldPublicId !== updateData.avatarPublicId) {
          await cloudinary.uploader.destroy(oldPublicId).catch(() => null)
        }
      }

      const updatedRows = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
          bio: users.bio,
          avatar: users.avatar,
          createdAt: users.createdAt,
        })

      const user = updatedRows?.[0] ?? null
      if (!user?.id) return res.status(500).json({ status: 'error', message: 'Failed to update user' })

      return res.json({ data: user })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ status: 'error', message: 'Error' })
    }
  }
}
