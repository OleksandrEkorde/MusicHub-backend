import { eq } from 'drizzle-orm'
import db from '../db/drizzle.js'
import { musicalNotes, noteTags, tags, timeSignatures, users } from '../db/schema.js'

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const parseIds = value => {
  if (value == null) return []

  if (Array.isArray(value)) {
    return value
      .flatMap(v => parseIds(v))
      .map(x => Number.parseInt(String(x).trim(), 10))
      .filter(n => Number.isFinite(n) && n > 0)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        return parseIds(JSON.parse(trimmed))
      } catch {
        return []
      }
    }

    return trimmed
      .split(',')
      .map(x => Number.parseInt(x.trim(), 10))
      .filter(n => Number.isFinite(n) && n > 0)
  }

  const asNum = Number.parseInt(String(value), 10)
  return Number.isFinite(asNum) && asNum > 0 ? [asNum] : []
}

const uniqIds = values => Array.from(new Set(values))

const loadNoteById = async id => {
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

      timeSignatureId: timeSignatures.id,
      timeSignatureName: timeSignatures.name,

      authorId: users.id,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
      authorEmail: users.email,

      tagId: tags.id,
      tagName: tags.name,
    })
    .from(musicalNotes)
    .leftJoin(users, eq(musicalNotes.userId, users.id))
    .leftJoin(timeSignatures, eq(timeSignatures.id, musicalNotes.timeSignatureId))
    .leftJoin(noteTags, eq(noteTags.noteId, musicalNotes.id))
    .leftJoin(tags, eq(tags.id, noteTags.tagId))
    .where(eq(musicalNotes.id, id))

  if (rows.length === 0) return null

  const first = rows[0]
  const note = {
    id: first.noteId,
    title: first.title,
    userId: first.userId ?? null,
    pdfUrl: first.pdfUrl ?? null,
    audioUrl: first.audioUrl ?? null,
    coverImageUrl: first.coverImageUrl ?? null,
    description: first.description ?? null,
    difficulty: first.difficulty ?? null,
    isPublic: first.isPublic,
    createdAt: first.createdAt,
    views: first.views ?? 0,
    size: first.timeSignatureId ? { id: first.timeSignatureId, name: first.timeSignatureName } : null,
    author: first.authorId
      ? {
          id: first.authorId,
          firstName: first.authorFirstName,
          lastName: first.authorLastName,
          email: first.authorEmail,
        }
      : null,
    tags: [],
  }

  const tagIds = new Set()
  for (const r of rows) {
    if (r.tagId && !tagIds.has(r.tagId)) {
      tagIds.add(r.tagId)
      note.tags.push({ id: r.tagId, name: r.tagName })
    }
  }

  return note
}

export default class UpdateNotesController {
  static async update(req, res) {
    try {
      const id = toPositiveInt(req.params.id, null)
      if (!id) return res.status(400).json({ status: 'error', message: 'Invalid id' })

      const authUserId = req.user?.id
      if (!authUserId) return res.status(401).json({ status: 'error', message: 'Unauthorized' })

      const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
      const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''
      const tagsIds = uniqIds(parseIds(req.body.tagsIds))

      if (!title) return res.status(400).json({ status: 'error', message: 'title is required' })

      const ownerRows = await db
        .select({ userId: musicalNotes.userId })
        .from(musicalNotes)
        .where(eq(musicalNotes.id, id))
        .limit(1)

      if (ownerRows.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' })

      const ownerId = ownerRows[0].userId
      if (!ownerId || ownerId !== authUserId) {
        return res.status(403).json({ status: 'error', message: 'Forbidden' })
      }

      await db.transaction(async tx => {
        await tx
          .update(musicalNotes)
          .set({
            title,
            description: description || null,
          })
          .where(eq(musicalNotes.id, id))

        await tx.delete(noteTags).where(eq(noteTags.noteId, id))

        if (tagsIds.length > 0) {
          await tx.insert(noteTags).values(tagsIds.map(tagId => ({ noteId: id, tagId })))
        }
      })

      const note = await loadNoteById(id)
      if (!note) return res.status(500).json({ status: 'error', message: 'Failed to load updated note' })

      return res.json({ data: note })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ status: 'error', message: 'Error' })
    }
  }
}
