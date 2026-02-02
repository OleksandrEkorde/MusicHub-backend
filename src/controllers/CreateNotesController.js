import { v2 as cloudinary } from 'cloudinary'
import { eq, inArray, sql } from 'drizzle-orm'
import multer from 'multer'
import db from '../db/drizzle.js'
import pool from '../db/db.js'
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

let notesColumnsCache = null
const getNotesColumns = async () => {
  if (notesColumnsCache) return notesColumnsCache
  const res = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema='public' AND table_name='notes'`,
  )
  notesColumnsCache = new Set(res.rows.map(r => r.column_name))
  return notesColumnsCache
}

const pick = (obj, cols) => {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    if (cols.has(k)) out[k] = v
  }
  return out
}

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

      const files = req.files || {}
      const pdfFile = files.pdf?.[0]
      const audioFile = files.audio?.[0]
      const coverFile = files.cover?.[0]

      const uploads = {}

      if (pdfFile?.buffer) {
        const r = await uploadBuffer(pdfFile.buffer, {
          resource_type: 'raw',
          folder: 'musichub/notes/pdf',
        })
        uploads.pdf_url = r.secure_url
        uploads.pdf_public_id = r.public_id
      }

      if (audioFile?.buffer) {
        const r = await uploadBuffer(audioFile.buffer, {
          resource_type: 'video',
          folder: 'musichub/notes/audio',
        })
        uploads.audio_url = r.secure_url
        uploads.audio_public_id = r.public_id
      }

      if (coverFile?.buffer) {
        const r = await uploadBuffer(coverFile.buffer, {
          resource_type: 'image',
          folder: 'musichub/notes/cover',
        })
        uploads.cover_image_url = r.secure_url
        uploads.cover_image_public_id = r.public_id
      }

      const cols = await getNotesColumns()

      const insertPayload = pick(
        {
          title,
          user_id: userId,
          time_signature_id: timeSignatureId,
          is_public: isPublic,
          ...uploads,
        },
        cols,
      )

      const insertKeys = Object.keys(insertPayload)
      if (insertKeys.length === 0) {
        return res.status(500).json({ message: 'No insertable columns found for notes' })
      }

      const placeholders = insertKeys.map((_, i) => `$${i + 1}`).join(', ')
      const values = insertKeys.map(k => insertPayload[k])

      const inserted = await pool.query(
        `INSERT INTO notes (${insertKeys.map(k => `"${k}"`).join(', ')})
         VALUES (${placeholders})
         RETURNING id`,
        values,
      )

      const noteId = inserted.rows?.[0]?.id
      if (!noteId) return res.status(500).json({ message: 'Failed to create note' })

      if (tagsIds.length > 0) {
        const uniqueTagIds = Array.from(new Set(tagsIds))
        const rows = uniqueTagIds.map(tagId => ({ noteId, tagId }))
        await db.insert(noteTags).values(rows)
      }

      const rows = await db
        .select({
          noteId: musicalNotes.id,
          title: musicalNotes.title,
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

      const first = rows[0]
      const note = {
        id: first.noteId,
        title: first.title,
        size: first.sizeId ? { id: first.sizeId, name: first.sizeName } : null,
        authorName: first.authorName,
        authorEmail: first.authorEmail,
        tags: [],
      }

      const seen = new Set()
      for (const r of rows) {
        if (r.tagId && !seen.has(r.tagId)) {
          seen.add(r.tagId)
          note.tags.push({ id: r.tagId, name: r.tagName })
        }
      }

      return res.status(201).json({ data: note })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Error' })
    }
  }
}
