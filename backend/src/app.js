import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

/** Builds the Express app without starting it, so it can be tested without opening a port. */
export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())

  // Only the configured frontend origin may call the API from a browser
  app.use(cors({ origin: env.clientOrigin, methods: ['GET', 'POST', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }))

  app.use(express.json({ limit: '100kb' }))

  app.use('/api/v1', routes)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
