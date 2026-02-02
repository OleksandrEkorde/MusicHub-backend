import { v2 as cloudinary } from 'cloudinary'
import { eq } from 'drizzle-orm'
import multer from 'multer'
import db from '../db/drizzle.js'
import { musicalNotes, noteTags, tags, timeSignatures, users } from '../db/schema.js'

const upload = multer({ storage: multer.memoryStorage() })

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const toBool = value => {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return false
  return value === '1' || value.toLowerCase() === 'true'
}

const parseIds = value => {
  if (value == null) return []
  const raw = Array.isArray(value) ? value.join(',') : String(value)
  return raw
    .split(',')
    .map(x => Number.parseInt(x.trim(), 10))
    .filter(n => Number.isFinite(n) && n > 0)
}

const toOptionalString = value => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

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

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
    stream.end(buffer)
  })

const getFirstFile = (files, field) => files?.[field]?.[0] ?? null

const uploadAsset = async (file, options) => {
  if (!file?.buffer) return null
  return uploadBuffer(file.buffer, options)
}

const uniqIds = values => Array.from(new Set(values))

const buildNoteResponse = (first, tagsList) => ({
  id: first.noteId,
  title: first.title,
  userId: first.userId ?? null,
  pdfUrl: first.pdfUrl ?? null,
  audioUrl: first.audioUrl ?? null,
  coverImageUrl: first.coverImageUrl ?? null,
  description: first.description ?? null,
  difficulty: first.difficulty ?? null,
  isPublic: first.isPublic ?? false,
  createdAt: first.createdAt ?? null,
  views: first.views ?? 0,
  size: first.sizeId ? { id: first.sizeId, name: first.sizeName } : null,
  authorName: first.authorName ?? null,
  authorEmail: first.authorEmail ?? null,
  tags: tagsList,
})

export default class CreateNotesController {
  static uploadMiddleware = upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ])

  static async create(req, res) {
    try {
      ensureCloudinary()

      const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
      if (!title) return res.status(400).json({ message: 'title is required' })

      const userId = toPositiveInt(req.body.userId, null)
      const timeSignatureId = toPositiveInt(req.body.timeSignatureId, null)
      const isPublic = toBool(req.body.isPublic)
      const tagsIds = parseIds(req.body.tagsIds)
      const description = toOptionalString(req.body.description)
      const difficulty = toOptionalString(req.body.difficulty)

      const files = req.files || {}
      const pdfFile = getFirstFile(files, 'pdf')
      const audioFile = getFirstFile(files, 'audio')
      const coverFile = getFirstFile(files, 'cover')

      const uploads = {}

      const pdfUpload = await uploadAsset(pdfFile, {
          resource_type: 'raw',
          folder: 'musichub/notes/pdf',
      })
      if (pdfUpload) {
        uploads.pdfUrl = pdfUpload.secure_url
        uploads.pdfPublicId = pdfUpload.public_id
      }

      const audioUpload = await uploadAsset(audioFile, {
          resource_type: 'video',
          folder: 'musichub/notes/audio',
      })
      if (audioUpload) {
        uploads.audioUrl = audioUpload.secure_url
        uploads.audioPublicId = audioUpload.public_id
      }

      const coverUpload = await uploadAsset(coverFile, {
          resource_type: 'image',
          folder: 'musichub/notes/cover',
      })
      if (coverUpload) {
        uploads.coverImageUrl = coverUpload.secure_url
        uploads.coverImagePublicId = coverUpload.public_id
      }

      const inserted = await db
        .insert(musicalNotes)
        .values({
          title,
          userId,
          timeSignatureId,
          isPublic,
          description,
          difficulty,
          ...uploads,
        })
        .returning({ id: musicalNotes.id })

      const noteId = inserted?.[0]?.id
      if (!noteId) return res.status(500).json({ message: 'Failed to create note' })

      if (tagsIds.length > 0) {
        const uniqueTagIds = uniqIds(tagsIds)
        const rows = uniqueTagIds.map(tagId => ({ noteId, tagId }))
        await db.insert(noteTags).values(rows)
      }

      const rows = await db
        .select({
          noteId: musicalNotes.id,
          title: musicalNotes.title,
          userId: musicalNotes.userId,
          pdfUrl: musicalNotes.pdfUrl,
          audioUrl: musicalNotes.audioUrl,
          coverImageUrl: musicalNotes.coverImageUrl,
          description: musicalNotes.description,
          difficulty: musicalNotes.difficulty,
          isPublic: musicalNotes.isPublic,
          createdAt: musicalNotes.createdAt,
          views: musicalNotes.views,
          sizeId: timeSignatures.id,
          sizeName: timeSignatures.name,
          authorName: users.firstName,
          authorEmail: users.email,
          tagId: tags.id,
          tagName: tags.name,
        })
        .from(musicalNotes)
        .leftJoin(users, eq(musicalNotes.userId, users.id))
        .leftJoin(timeSignatures, eq(timeSignatures.id, musicalNotes.timeSignatureId))
        .leftJoin(noteTags, eq(noteTags.noteId, musicalNotes.id))
        .leftJoin(tags, eq(tags.id, noteTags.tagId))
        .where(eq(musicalNotes.id, noteId))

      if (rows.length === 0) {
        return res.status(500).json({ message: 'Failed to load created note' })
      }

      const first = rows[0]

      const tagsList = []
      const seen = new Set()
      for (const r of rows) {
        if (!r.tagId) continue
        if (seen.has(r.tagId)) continue
        seen.add(r.tagId)
        tagsList.push({ id: r.tagId, name: r.tagName })
      }

      return res.status(201).json({ data: buildNoteResponse(first, tagsList) })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Error' })
    }
  }
}
