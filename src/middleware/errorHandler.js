export default function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  const status = Number.isFinite(err?.status) ? err.status : 500
  const message = typeof err?.message === 'string' && err.message ? err.message : 'Error'

  return res.status(status).json({ status, message })
}
