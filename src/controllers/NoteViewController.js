import { and, eq, sql } from 'drizzle-orm'
import db from '../db/drizzle.js'
import { musicalNotes, noteView } from '../db/schema.js'

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export default class NoteViewController {
  static async view(req, res) {
    try {
      const noteId = toPositiveInt(req.params.id, null)
      if (!noteId) return res.status(400).json({ status: 'error', message: 'Invalid id' })

      const userId = req.user?.id
      if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' })

      const result = await db.transaction(async tx => {
        const noteRows = await tx
          .select({ id: musicalNotes.id })
          .from(musicalNotes)
          .where(eq(musicalNotes.id, noteId))
          .limit(1)

        if (noteRows.length === 0) {
          return { status: 404, body: { status: 'error', message: 'Not found' } }
        }

        const existing = await tx
          .select({ id: noteView.id })
          .from(noteView)
          .where(and(eq(noteView.noteId, noteId), eq(noteView.userId, userId)))
          .limit(1)

        if (existing.length > 0) {
          return { status: 200, body: { status: 'success', viewed: true, incremented: false } }
        }
        await tx.insert(noteView).values({ noteId, userId, createdAt: new Date() })
        await tx
          .update(musicalNotes)
          .set({ views: sql`${musicalNotes.views} + 1` })
          .where(eq(musicalNotes.id, noteId))

        return { status: 200, body: { status: 'success', viewed: true, incremented: true } }
      })

      return res.status(result.status).json(result.body)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ status: 'error', message: 'Error' })
    }
  }
}
