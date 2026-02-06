
import { eq } from 'drizzle-orm'
import db from '../db/drizzle.js'
import { users } from '../db/schema.js'

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export default class UsersController {
  static async me(req, res) {
    try {
      const id = req.user?.id
      if (!id) return res.status(401).json({ message: 'Unauthorized' })

      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1)

      if (rows.length === 0) return res.status(404).json({ message: 'Not found' })
      return res.json({ data: rows[0] })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Error' })
    }
  }

  static async getById(req, res) {
    try {
      const id = toPositiveInt(req.params.id, null)
      if (!id) return res.status(400).json({ message: 'Invalid id' })

      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1)

      if (rows.length === 0) return res.status(404).json({ message: 'Not found' })
      return res.json({ data: rows[0] })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Error' })
    }
  }
}
