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
 * /me:
 *   get:
 *     summary: Get current user
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test@test.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               firstName:
 *                 type: string
 *                 example: "Test"
 *               lastName:
 *                 type: string
 *                 example: "User"
 *     responses:
 *       201:
 *         description: Created
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly cookie with access token (access_token)
 *             schema: { type: string }
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { type: object }
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test@test.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OK
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly cookie with access token (access_token)
 *             schema: { type: string }
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { type: object }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user (clears access_token cookie)
 *     responses:
 *       200:
 *         description: OK
 *         headers:
 *           Set-Cookie:
 *             description: Clears HttpOnly cookie access_token
 *             schema: { type: string }
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /my-songs:
 *   get:
 *     summary: Get current user's musical notes (paginated)
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /composers/{composerId}/songs:
 *   get:
 *     summary: Get paginated list of musical notes by composer id
 *     parameters:
 *       - in: path
 *         name: composerId
 *         required: true
 *         schema: { type: integer }
 *         description: Composer (user) ID
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
 *       400:
 *         description: Invalid composerId
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
 *         application/json:
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
 *               description:
 *                 type: string
 *                 example: "Some description"
 *               difficulty:
 *                 type: string
 *                 example: "easy"
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
 *               description:
 *                 type: string
 *                 example: "Some description"
 *               difficulty:
 *                 type: string
 *                 example: "easy"
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
 * /songs/{id}/view:
 *   post:
 *     summary: Track note view (first view increments views)
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Viewed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 viewed: { type: boolean, example: true }
 *                 incremented: { type: boolean, example: true }
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server Error
 *   put:
 *     summary: Update a musical note (only owner)
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - tagsIds
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Nocturne Op.9 No.2 (Edited)"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               tagsIds:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid id / validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not owner)
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server Error
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
 *                 description: Optional extra list of Cloudinary assets to remove. By default, assets are taken from the note record (public_id/url).
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
