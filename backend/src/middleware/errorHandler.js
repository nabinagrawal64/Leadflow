import mongoose from 'mongoose'
import { env } from '../config/env.js'

/** Error with an HTTP status, for use by controllers later: throw new ApiError(404, 'Lead not found') */
export class ApiError extends Error {
  constructor(status, message, errors = []) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

// Express 5 forwards errors from async handlers here automatically.
// Response shape follows the assignment: { success: false, message, errors: [] }
// Stack traces and driver internals are never sent to the client.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || err.statusCode || 500
  let message = err.message
  let errors = err.errors || []

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400
    message = 'Validation failed'
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400
    message = `Invalid value for ${err.path}`
    errors = [{ field: err.path, message }]
  } else if (err?.code === 11000) {
    status = 409
    const field = Object.keys(err.keyPattern || {})[0] || 'value'
    message = `${field === 'email' ? 'Email' : 'That value'} is already in use`
    errors = [{ field, message }]
  } else if (err?.type === 'entity.parse.failed') {
    status = 400
    message = 'Request body is not valid JSON'
  } else if (err?.type === 'entity.too.large') {
    status = 413
    message = 'Request body is too large'
  }

  if (status >= 500) {
    // Log the real cause on the server only
    console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`)
    if (!env.isProduction) console.error(err.stack)
    message = 'Something went wrong on our side'
    errors = []
  }

  res.status(status).json({ success: false, message, errors })
}
