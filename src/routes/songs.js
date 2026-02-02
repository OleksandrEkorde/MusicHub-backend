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
 *       - in: query
 *         name: sizes
 *         schema: { type: string, example: "4/4,3/4" }
 *         description: Comma-separated list of time signature names to filter by (OR logic). Also supports numeric IDs.
 *       - in: query
 *         name: query
 *         schema: { type: string, example: "nocturne" }
 *         description: Search by note title (case-insensitive, substring match).
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

/**
 * @swagger
 * /songs:
 *   post:
 *     summary: Create a musical note
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Nocturne Op.9 No.2"
 *               userId:
 *                 type: integer
 *                 example: 1
 *               timeSignatureId:
 *                 type: integer
 *                 example: 3
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *               tagsIds:
 *                 type: string
 *                 example: "1,2,3"
 *               pdf:
 *                 type: string
 *                 format: binary
 *               audio:
 *                 type: string
 *                 format: binary
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /songs/{id}:
 *   delete:
 *     summary: Delete a musical note
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Note ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assets:
 *                 type: array
 *                 description: Optional list of Cloudinary assets to remove
 *                 items:
 *                   type: object
 *                   properties:
 *                     publicId: { type: string, example: "folder/file" }
 *                     url: { type: string, example: "https://res.cloudinary.com/.../upload/v123/folder/file.pdf" }
 *                     resourceType: { type: string, example: "image" }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Deleted" }
 *       400:
 *         description: Invalid id
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /time-signatures:
 *   get:
 *     summary: Get paginated list of time signatures
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *         description: The number of items per page (max 50).
 *     responses:
 *       200:
 *         description: A paginated list of time signatures.
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
 *                       id: { type: integer }
 *                       name: { type: string }
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

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Get paginated list of tags
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *         description: The number of items per page (max 50).
 *     responses:
 *       200:
 *         description: A paginated list of tags.
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
 *                       id: { type: integer }
 *                       name: { type: string }
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
