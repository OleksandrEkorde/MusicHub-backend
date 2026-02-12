import db from "../db/drizzle.js";
import { notes } from "../db/schema.js";
import { eq } from "drizzle-orm";

class DownloadController {
    async downloadPdf(req, res) {
        try {
            const { id } = req.params;

            const note = await db.query.notes.findFirst({
                where: eq(notes.id, id),
            });

            if (!note) {
                return res.status(404).json({ message: "Note not found" });
            }

            if (!note.pdfUrl) {
                return res.status(404).json({ message: "PDF not found for this note" });
            }


            return res.json({
                status: "success",
                downloadUrl: note.pdfUrl,
            });
        } catch (error) {
            console.error("Error downloading PDF:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
}

export default new DownloadController();