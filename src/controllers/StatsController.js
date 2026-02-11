import db from '../db/drizzle.js'
import { desc } from 'drizzle-orm'
import { users } from '../db/schema.js'



export default class StatsController {
  static async usersList(req, res) {
    try {
      const list = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
        })
        .from(users)
        .orderBy(desc(users.createdAt))

      return res.json(list)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ status: 'error', message: 'Server error' })
    }
  }
  
}
