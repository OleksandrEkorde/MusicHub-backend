
import db from "../db/db.js";
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

            // Redirect to the Cloudinary URL (or wherever it is stored)
            // If we want to force download, we might need to proxy it or use specific headers, 
            // but redirect is often enough for external storage unless we need to hide the URL.
            // Requirements said "download", redirecting to a resource usually triggers browser handling.
            // To force download on client side usually `Content-Disposition` is needed, but that's on the file server side.
            // Cloudinary allows adding `fl_attachment` to URL to force download.

            // Let's check if it is a cloudinary url and append flag if needed, or just redirect.
            // Assuming simple redirect for now.

            return res.redirect(note.pdfUrl);

        } catch (error) {
            console.error("Error downloading PDF:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
}

export default new DownloadController();
