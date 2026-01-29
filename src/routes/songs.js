/**
 * @swagger
 * /songs:
 *   get:
 *     summary: Get paginated list of musical notes with filtering options
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *         description: The number of items per page (max 50).
 *       - in: query
 *         name: tagsIds
 *         schema: { type: string, example: "1,2,3" }
 *         description: Comma-separated list of tag IDs to filter by (OR logic).
 *       - in: query
 *         name: timeSignaturesIds
 *         schema: { type: string, example: "4,5" }
 *         description: Comma-separated list of time signature IDs to filter by (OR logic).
 *     responses:
 *       200:
 *         description: A paginated list of musical notes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 *                       content: { type: string }
 *                       size:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                         nullable: true
 *                       authorName: { type: string }
 *                       authorEmail: { type: string }
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id: { type: string }
 *                             name: { type: string }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems: { type: integer }
 *                     totalPages: { type: integer }
 *                     currentPage: { type: integer }
 *                     limit: { type: integer }
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Error" }
 */
router.get("/songs", controller);