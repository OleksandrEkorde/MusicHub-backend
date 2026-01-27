import db from '../db/drizzle.js'
import { desc, eq } from 'drizzle-orm'
import { users, musicalNotes, tags, noteTags, timeSignatures } from '../db/schema.js'

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export default class NotesPaginationController {
  static async NoteList(req, res) {
    try {
      const page = toPositiveInt(req.query.page, 1)
      const limit = Math.min(toPositiveInt(req.query.limit, 10), 50)
      const offset = (page - 1) * limit

      const rows = await db
        .select({
          noteId: musicalNotes.id,
          title: musicalNotes.title,
          content: musicalNotes.content,

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
        .orderBy(desc(musicalNotes.createdAt))
        .limit(limit)
        .offset(offset)

      const notesById = new Map()

      for (const r of rows) {
        let note = notesById.get(r.noteId)

        if (!note) {
          note = {
            id: r.noteId,
            title: r.title,
            content: r.content,
            size: r.sizeId ? { id: r.sizeId, name: r.sizeName } : null,
            authorName: r.authorName,
            authorEmail: r.authorEmail,
            tags: [],
          }

          notesById.set(r.noteId, { note, tagIds: new Set() })
        }

        const entry = notesById.get(r.noteId)
        if (r.tagId && !entry.tagIds.has(r.tagId)) {
          entry.tagIds.add(r.tagId)
          entry.note.tags.push({ id: r.tagId, name: r.tagName })
        }
      }

      const result = [...notesById.values()].map(x => x.note)
      return res.json(result)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Error' })
    }
  }
}
