
import db from "../db/drizzle.js";
import { noteLikes, notes, users, tags, noteTags, timeSignatures } from "../db/schema.js";
import { eq, and, desc, inArray } from "drizzle-orm";

class LikesController {
    async toggle(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const existingLike = await db
                .select()
                .from(noteLikes)
                .where(and(eq(noteLikes.noteId, id), eq(noteLikes.userId, userId)));

            if (existingLike.length > 0) {
                // Unlike
                await db
                    .delete(noteLikes)
                    .where(and(eq(noteLikes.noteId, id), eq(noteLikes.userId, userId)));
                return res.json({ status: "success", liked: false });
            } else {
                // Like
                await db.insert(noteLikes).values({
                    noteId: id,
                    userId: userId,
                    createdAt: new Date(),
                });
                return res.json({ status: "success", liked: true });
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async listFavorites(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            // 1. Get total count
            const allFavorites = await db
                .select({ id: noteLikes.id })
                .from(noteLikes)
                .where(eq(noteLikes.userId, userId));

            const totalItems = allFavorites.length;
            const totalPages = Math.ceil(totalItems / limit);

            if (totalItems === 0) {
                return res.json({
                    data: [],
                    meta: {
                        totalItems,
                        totalPages,
                        currentPage: Number(page),
                        limit: Number(limit)
                    }
                });
            }

            // 2. Get paginated note IDs
            const favoriteRows = await db
                .select({ noteId: noteLikes.noteId })
                .from(noteLikes)
                .where(eq(noteLikes.userId, userId))
                .orderBy(desc(noteLikes.createdAt))
                .limit(Number(limit))
                .offset(Number(offset));

            const noteIds = favoriteRows.map(r => r.noteId);

            // 3. Fetch full note details
            const rows = await db
                .select({
                    noteId: notes.id,
                    title: notes.title,
                    userId: notes.userId,
                    pdfUrl: notes.pdfUrl,
                    audioUrl: notes.audioUrl,
                    coverImageUrl: notes.coverImageUrl,
                    description: notes.description,
                    difficulty: notes.difficulty,
                    isPublic: notes.isPublic,
                    createdAt: notes.createdAt,
                    views: notes.views,

                    sizeId: timeSignatures.id,
                    sizeName: timeSignatures.name,

                    authorId: users.id,
                    authorFirstName: users.firstName,
                    authorLastName: users.lastName,
                    authorEmail: users.email,
                    authorAvatar: users.avatar,

                    tagId: tags.id,
                    tagName: tags.name,
                })
                .from(notes)
                .leftJoin(users, eq(notes.userId, users.id))
                .leftJoin(timeSignatures, eq(timeSignatures.id, notes.timeSignatureId))
                .leftJoin(noteTags, eq(noteTags.noteId, notes.id))
                .leftJoin(tags, eq(tags.id, noteTags.tagId))
                .where(inArray(notes.id, noteIds));

            const notesById = new Map();

            for (const r of rows) {
                let note = notesById.get(r.noteId);

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
                        favourite: true,
                        size: r.sizeId ? { id: r.sizeId, name: r.sizeName } : null,
                        author: r.authorId
                            ? {
                                id: r.authorId,
                                firstName: r.authorFirstName,
                                lastName: r.authorLastName,
                                email: r.authorEmail,
                                avatar: r.authorAvatar,
                            }
                            : null,
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

            const result = noteIds
                .map(id => notesById.get(id))
                .filter(Boolean)
                .map(x => x.note);

            return res.json({
                data: result,
                meta: {
                    totalItems,
                    totalPages,
                    currentPage: Number(page),
                    limit: Number(limit)
                }
            });

        } catch (error) {
            console.error("Error listing favorites:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
}

export default new LikesController();
