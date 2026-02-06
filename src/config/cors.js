export const buildCorsOptions = () => {
  return {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }
}
