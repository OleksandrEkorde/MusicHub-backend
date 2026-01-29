import db from '../db/drizzle.js'
import { asc, sql } from 'drizzle-orm'
import { timeSignatures } from '../db/schema.js'

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export default class TimeSignaturesController {
  static async list(req, res) {
    try {
      const page = toPositiveInt(req.query.page, 1)
      const limit = Math.min(toPositiveInt(req.query.limit, 10), 50)
      const offset = (page - 1) * limit

      const countRows = await db
        .select({ totalItems: sql`COUNT(*)` })
        .from(timeSignatures)

      const totalItems = Number.parseInt(String(countRows?.[0]?.totalItems ?? 0), 10) || 0
      const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 0

      const rows = await db
        .select({ id: timeSignatures.id, name: timeSignatures.name })
        .from(timeSignatures)
        .orderBy(asc(timeSignatures.name))
        .limit(limit)
        .offset(offset)

      return res.json({
        data: rows,
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
}
