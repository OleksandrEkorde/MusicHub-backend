import db from '../db/drizzle.js'
import { and, countDistinct, desc, eq, ilike, inArray, or } from 'drizzle-orm'
import { users, musicalNotes, tags, noteTags, timeSignatures } from '../db/schema.js'

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const parseArrayParam = value => {
  if (value == null) return []
  if (Array.isArray(value)) return value.flatMap(parseArrayParam)

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        return parseArrayParam(parsed)
      } catch {
        return []
      }
    }

    return trimmed
      .split(',')
      .map(x => x.trim())
      .filter(Boolean)
  }

  return [String(value)]
}

const splitToIdsAndNames = values => {
  const ids = []
  const names = []

  for (const v of values) {
    const asNum = Number.parseInt(String(v), 10)
    if (Number.isFinite(asNum) && String(asNum) === String(v)) ids.push(asNum)
    else names.push(String(v))
  }

  return { ids, names }
}

const toLikePattern = value => {
  const v = String(value)
  return v.includes('%') ? v : `%${v}%`
}

export default class NotesPaginationController {
  static async NoteList(req, res) {
    try {
      const page = toPositiveInt(req.query.page, 1)
      const limit = Math.min(toPositiveInt(req.query.limit, 10), 50)
      const offset = (page - 1) * limit

      const rawTags = parseArrayParam(req.query.tags ?? req.query.tagsIds)
      const rawTimeSignatures = parseArrayParam(
        req.query.time_signature ?? req.query.timeSignatures ?? req.query.timeSignaturesIds,
      )
      const rawSizes = parseArrayParam(req.query.sizes ?? req.query.size)
      const query = typeof req.query.query === 'string' ? req.query.query.trim() : ''

      const { ids: tagIds, names: tagNames } = splitToIdsAndNames(rawTags)
      const { ids: tsIds, names: tsNames } = splitToIdsAndNames(rawTimeSignatures)
      const { ids: sizeIds, names: sizeNames } = splitToIdsAndNames(rawSizes)

      const whereConditions = []

      if (query) {
        whereConditions.push(ilike(musicalNotes.title, `%${query}%`))
      }

      const hasTimeFilter = tsIds.length > 0 || tsNames.length > 0
      if (hasTimeFilter) {
        const conds = []
        if (tsIds.length > 0) conds.push(inArray(musicalNotes.timeSignatureId, tsIds))
        if (tsNames.length > 0) conds.push(or(...tsNames.map(n => ilike(timeSignatures.name, toLikePattern(n)))))

        whereConditions.push(conds.length === 1 ? conds[0] : or(...conds))
      }

      const hasSizesFilter = sizeIds.length > 0 || sizeNames.length > 0
      if (hasSizesFilter) {
        const conds = []
        if (sizeIds.length > 0) conds.push(inArray(musicalNotes.timeSignatureId, sizeIds))
        if (sizeNames.length > 0) conds.push(or(...sizeNames.map(s => ilike(timeSignatures.name, toLikePattern(s)))))

        whereConditions.push(conds.length === 1 ? conds[0] : or(...conds))
      }

      const hasTagsFilter = tagIds.length > 0 || tagNames.length > 0
      if (hasTagsFilter) {
        const conds = []
        if (tagIds.length > 0) conds.push(inArray(noteTags.tagId, tagIds))
        if (tagNames.length > 0) conds.push(or(...tagNames.map(n => ilike(tags.name, toLikePattern(n)))))

        whereConditions.push(conds.length === 1 ? conds[0] : or(...conds))
      }

      const matchCountExpr = hasTagsFilter ? countDistinct(noteTags.tagId) : null

      const whereExpr = whereConditions.length > 0 ? and(...whereConditions) : undefined

      const countRows = await db
        .select({
          totalItems: countDistinct(musicalNotes.id),
        })
        .from(musicalNotes)
        .leftJoin(timeSignatures, eq(timeSignatures.id, musicalNotes.timeSignatureId))
        .leftJoin(noteTags, eq(noteTags.noteId, musicalNotes.id))
        .leftJoin(tags, eq(tags.id, noteTags.tagId))
        .where(whereExpr)

      const totalItems = Number.parseInt(String(countRows?.[0]?.totalItems ?? 0), 10) || 0
      const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 0

      const idRows = await db
        .select({
          noteId: musicalNotes.id,
          createdAt: musicalNotes.createdAt,
          matchCount: matchCountExpr ?? 0,
        })
        .from(musicalNotes)
        .leftJoin(timeSignatures, eq(timeSignatures.id, musicalNotes.timeSignatureId))
        .leftJoin(noteTags, eq(noteTags.noteId, musicalNotes.id))
        .leftJoin(tags, eq(tags.id, noteTags.tagId))
        .where(whereExpr)
        .groupBy(musicalNotes.id, musicalNotes.createdAt)
        .orderBy(
          ...(hasTagsFilter ? [desc(countDistinct(noteTags.tagId))] : []),
          desc(musicalNotes.createdAt),
        )
        .limit(limit)
        .offset(offset)

      const noteIds = idRows.map(r => r.noteId)
      if (noteIds.length === 0) {
        return res.json({
          data: [],
          meta: {
            totalItems,
            totalPages,
            currentPage: page,
            limit,
          },
        })
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
        .where(inArray(musicalNotes.id, noteIds))

      const notesById = new Map()

      for (const r of rows) {
        let note = notesById.get(r.noteId)

        if (!note) {
          note = {
            id: r.noteId,
            title: r.title,
            userId: r.userId ?? null,
            pdfUrl: r.pdfUrl ?? null,
            audioUrl: r.audioUrl ?? null,
            coverImageUrl: r.coverImageUrl ?? null,
            description: r.description ?? null,
            difficulty: r.difficulty ?? null,
            isPublic: r.isPublic ?? false,
            createdAt: r.createdAt ?? null,
            views: r.views ?? 0,
            size: r.sizeId ? { id: r.sizeId, name: r.sizeName } : null,
            author: r.authorId
              ? {
                  id: r.authorId,
                  firstName: r.authorFirstName,
                  lastName: r.authorLastName,
                  email: r.authorEmail,
                }
              : null,
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

      const result = noteIds
        .map(id => notesById.get(id))
        .filter(Boolean)
        .map(x => x.note)
      return res.json({
        data: result,
        meta: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Error' })
    }
  }

  static async NoteById(req, res) {
    try {
      const id = Number.parseInt(req.params.id, 10)
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ message: 'Invalid id' })
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

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Not found' })
      }

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
        size: first.timeSignatureId
          ? { id: first.timeSignatureId, name: first.timeSignatureName }
          : null,
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

      return res.json({ data: note })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Error' })
    }
  }
}
