import { v2 as cloudinary } from 'cloudinary'
import { eq } from 'drizzle-orm'
import db from '../db/drizzle.js'
import { musicalNotes, noteTags, noteView } from '../db/schema.js'

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) return null
  return { cloudName, apiKey, apiSecret }
}

const extractPublicIdFromUrl = url => {
  if (!url || typeof url !== 'string') return null

  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)

    const uploadIdx = parts.indexOf('upload')
    if (uploadIdx === -1) return null

    let tail = parts.slice(uploadIdx + 1)
    if (tail.length === 0) return null

    if (/^v\d+$/.test(tail[0])) tail = tail.slice(1)
    if (tail.length === 0) return null

    const last = tail[tail.length - 1]
    const withoutExt = last.includes('.') ? last.slice(0, last.lastIndexOf('.')) : last
    return [...tail.slice(0, -1), withoutExt].join('/')
  } catch {
    return null
  }
}

const normalizeAsset = asset => {
  if (!asset) return null

  if (typeof asset === 'string') {
    return { publicId: asset, resourceType: 'auto' }
  }

  const publicId = asset.publicId ?? asset.public_id ?? null
  const url = asset.url ?? null
  const resourceType = asset.resourceType ?? asset.resource_type ?? 'auto'

  return {
    publicId: publicId ?? extractPublicIdFromUrl(url),
    resourceType,
  }
}

const deleteCloudinaryAssets = async assetsRaw => {
  const cfg = getCloudinaryConfig()
  if (!cfg) return

  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
  })

  const assets = Array.isArray(assetsRaw) ? assetsRaw : []
  for (const a of assets) {
    const normalized = normalizeAsset(a)
    if (!normalized?.publicId) continue

    try {
      await cloudinary.uploader.destroy(normalized.publicId, {
        resource_type: normalized.resourceType ?? 'auto',
        invalidate: true,
      })
    } catch {
    }
  }
}

export default class DeleteNotesController {
  static async delete(req, res) {
    try {
      const id = toPositiveInt(req.params.id, null)
      if (!id) return res.status(400).json({ message: 'Invalid id' })

      const noteRows = await db
        .select({ id: musicalNotes.id })
        .from(musicalNotes)
        .where(eq(musicalNotes.id, id))
        .limit(1)

      if (noteRows.length === 0) return res.status(404).json({ message: 'Not found' })

      await db.transaction(async tx => {
        await tx.delete(noteTags).where(eq(noteTags.noteId, id))
        await tx.delete(noteView).where(eq(noteView.noteId, id))
        await tx.delete(musicalNotes).where(eq(musicalNotes.id, id))
      })
      await deleteCloudinaryAssets(req.body?.assets)

      return res.json({ message: 'Deleted' })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Error' })
    }
  }
}