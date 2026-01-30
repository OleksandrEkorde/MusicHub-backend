import pg from 'pg'
const { Pool } = pg

const ssl = process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl,
})

export async function checkDbConnection() {
  await pool.query('SELECT 1')
}

export default pool
