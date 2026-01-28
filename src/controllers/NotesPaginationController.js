import db from "../db/drizzle.js";
import { desc, eq, and, inArray, countDistinct } from "drizzle-orm";
import {
  users,
  musicalNotes,
  tags,
  noteTags,
  timeSignatures,
} from "../db/schema.js";

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const parseIds = (value) => {
  if (!value) return [];
  return value
    .split(",")
    .map((id) => Number.parseInt(id.trim(), 10))
    .filter(Number.isFinite);
};

export default class NotesPaginationController {
  static async NoteList(req, res) {
    try {
      const page = toPositiveInt(req.query.page, 1);
      const limit = Math.min(toPositiveInt(req.query.limit, 10), 50);
      const offset = (page - 1) * limit;

      const tagsIds = parseIds(req.query.tagsIds);
      const timeSignaturesIds = parseIds(req.query.timeSignaturesIds);

      const conditions = [];
      if (timeSignaturesIds.length > 0) {
        conditions.push(
          inArray(musicalNotes.timeSignatureId, timeSignaturesIds),
        );
      }
      if (tagsIds.length > 0) {
        conditions.push(inArray(noteTags.tagId, tagsIds));
      }
      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const countQuery = db
        .select({ value: countDistinct(musicalNotes.id) })
        .from(musicalNotes);

      if (tagsIds.length > 0) {
        countQuery.leftJoin(noteTags, eq(noteTags.noteId, musicalNotes.id));
      }
      if (whereClause) {
        countQuery.where(whereClause);
      }

      const totalItemsResult = await countQuery;
      const totalItems = totalItemsResult[0].value;
      const totalPages = Math.ceil(totalItems / limit);

      const noteIdsQuery = db
        .selectDistinct({ id: musicalNotes.id })
        .from(musicalNotes)
        .orderBy(desc(musicalNotes.id))
        .limit(limit)
        .offset(offset);

      if (tagsIds.length > 0) {
        noteIdsQuery.leftJoin(noteTags, eq(noteTags.noteId, musicalNotes.id));
      }
      if (whereClause) {
        noteIdsQuery.where(whereClause);
      }

      const noteIdsResult = await noteIdsQuery;
      const noteIds = noteIdsResult.map((r) => r.id);

      let result = [];
      if (noteIds.length > 0) {
        const rowsQuery = db
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
          .leftJoin(
            timeSignatures,
            eq(timeSignatures.id, musicalNotes.timeSignatureId),
          )
          .leftJoin(noteTags, eq(noteTags.noteId, musicalNotes.id))
          .leftJoin(tags, eq(tags.id, noteTags.tagId))
          .where(inArray(musicalNotes.id, noteIds))
          .orderBy(desc(musicalNotes.id));

        const rows = await rowsQuery;

        const notesById = new Map();
        for (const r of rows) {
          let note = notesById.get(r.noteId);

          if (!note) {
            note = {
              id: r.noteId,
              title: r.title,
              content: r.content,
              size: r.sizeId ? { id: r.sizeId, name: r.sizeName } : null,
              authorName: r.authorName,
              authorEmail: r.authorEmail,
              tags: [],
            };
            notesById.set(r.noteId, { note, tagIds: new Set() });
          }

          const entry = notesById.get(r.noteId);
          if (r.tagId && !entry.tagIds.has(r.tagId)) {
            entry.tagIds.add(r.tagId);
            entry.note.tags.push({ id: r.tagId, name: r.tagName });
          }
        }
        result = [...notesById.values()].map((x) => x.note);
        const sorter = new Map(noteIds.map((id, index) => [id, index]));
        result.sort((a, b) => sorter.get(a.id) - sorter.get(b.id));
      }

      return res.json({
        data: result,
        meta: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error" });
    }
  }
}
