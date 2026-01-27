import pg from 'pg'
const { Pool } = pg
console.log('DB_HOST:', process.env.DB_HOST)

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

  const connInfo = await pool.query(
    "select current_database() as db, current_user as user, current_setting('search_path') as search_path"
  )
  console.table(connInfo.rows)

  const tables = await pool.query(
    "select to_regclass('public.notes') as public_notes, to_regclass('public.musical_notes') as public_musical_notes"
  )
  console.table(tables.rows)
}

export default pool
