import { drizzle } from 'drizzle-orm/node-postgres'
import pool from './db.js'
import * as schema from './schema.js'

const db = drizzle(pool, { schema })

export default db
export { db }
