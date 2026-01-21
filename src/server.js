import express from 'express'
import { checkDbConnection } from './db/db.js'
import StatsController from './controllers/StatsController.js'

const app = express()
app.use(express.json())
app.get('/stats/users', StatsController.usersList)
const PORT = process.env.SRV_PORT

async function start() {
  try {
    await checkDbConnection()
    console.log('Успішне підключення PostgreSQL')

    app.listen(PORT, () => {
      console.log(`Сервер запущено на порту ${PORT}`)
    }) 
  } catch (err) {
    console.error('Помилка при старті серверу', err)
    process.exit(1)
  }
}

start()
