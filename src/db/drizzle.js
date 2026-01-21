import { drizzle } from 'drizzle-orm/node-postgres'
import pool from './db.js'

const db = drizzle(pool)

export default db
export { db }
