
import db from "../db/db.js";
import { noteLikes, notes, users } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";

class LikesController {
    async toggle(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id; // Assumes requireAuth middleware

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

            // Fetch liked notes with pagination
            // Drizzle doesn't have a simple join-and-map for this in one go returning note structure directly easily without defining relation, 
            // but we can join.

            const favorites = await db
                .select({
                    id: notes.id,
                    title: notes.title,
                    coverImageUrl: notes.coverImageUrl,
                    userId: notes.userId,
                    authorFirstName: users.firstName,
                    authorLastName: users.lastName,
                })
                .from(noteLikes)
                .innerJoin(notes, eq(noteLikes.noteId, notes.id))
                .leftJoin(users, eq(notes.userId, users.id))
                .where(eq(noteLikes.userId, userId))
                .orderBy(desc(noteLikes.createdAt))
                .limit(Number(limit))
                .offset(Number(offset));

            // Get total count for metadata
            const allFavorites = await db
                .select({ id: noteLikes.id })
                .from(noteLikes)
                .where(eq(noteLikes.userId, userId));

            const totalItems = allFavorites.length;
            const totalPages = Math.ceil(totalItems / limit);

            return res.json({
                data: favorites,
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
