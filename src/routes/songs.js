/**
 * @swagger
 * /songs:
 *   get:
 *     summary: Get songs list
 *     parameters:
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items: { type: string }
 *         style: form
 *         explode: true
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/songs", controller);
