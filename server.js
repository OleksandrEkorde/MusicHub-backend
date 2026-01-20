import express from 'express'

const app = express()

app.use(express.json())

const PORT = 67
app.listen(PORT, () => {
  console.log(`Сервер успішно запущено на порту ${PORT}`)
})
