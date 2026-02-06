import { and, eq } from 'drizzle-orm'
import db from '../db/drizzle.js'
import { musicalNotes, noteTags, tags, timeSignatures, users } from '../db/schema.js'
import { sendError } from '../utils/sendError.js'

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const parseIds = value => {
  if (value == null) return []
  if (Array.isArray(value)) return value.map(v => Number.parseInt(String(v), 10))
  return String(value)
    .split(',')
    .map(x => Number.parseInt(x.trim(), 10))
}

const uniqIds = values => Array.from(new Set(values.filter(n => Number.isFinite(n) && n > 0)))

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
  author: first.authorId
    ? {
        id: first.authorId,
        firstName: first.authorFirstName,
        lastName: first.authorLastName,
        email: first.authorEmail,
      }
    : null,
  tags: tagsList,
})

export default class UpdateNotesController {
  static async update(req, res, next) {
    try {
      const id = toPositiveInt(req.params.id, null)
      if (!id) return sendError(res, 400, 'Invalid id')

      const authUserId = req.user?.id
      if (!authUserId) return sendError(res, 401, 'Unauthorized')

      const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
      const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''
      const tagsIds = uniqIds(parseIds(req.body.tagsIds))

      if (!title) return sendError(res, 400, 'title is required')

      const ownerRows = await db
        .select({ userId: musicalNotes.userId })
        .from(musicalNotes)
        .where(eq(musicalNotes.id, id))
        .limit(1)

      if (ownerRows.length === 0) return sendError(res, 404, 'Not found')
      const ownerId = ownerRows[0].userId
      if (!ownerId || ownerId !== authUserId) return sendError(res, 403, 'Forbidden')

      await db.transaction(async tx => {
        await tx
          .update(musicalNotes)
          .set({
            title,
            description: description ? description : null,
          })
          .where(eq(musicalNotes.id, id))

        await tx.delete(noteTags).where(eq(noteTags.noteId, id))

        if (tagsIds.length > 0) {
          await tx.insert(noteTags).values(tagsIds.map(tagId => ({ noteId: id, tagId })))
        }
      })

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
        .where(and(eq(musicalNotes.id, id), eq(musicalNotes.userId, authUserId)))

      if (rows.length === 0) return sendError(res, 500, 'Failed to load updated note')

      const tagsList = []
      const seen = new Set()
      for (const r of rows) {
        if (!r.tagId) continue
        if (seen.has(r.tagId)) continue
        seen.add(r.tagId)
        tagsList.push({ id: r.tagId, name: r.tagName })
      }

      return res.json({ data: buildNoteResponse(rows[0], tagsList) })
    } catch (err) {
      return next(err)
    }
  }
}
