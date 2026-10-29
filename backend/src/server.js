import { env } from './config/env.js' // validates the environment first
import { connectDB, disconnectDB } from './config/db.js'
import { createApp } from './app.js'
// Importing the models registers them (and their indexes) with Mongoose
import './models/index.js'

async function start() {
  // Connect before accepting traffic so requests never hit a half-ready server
  await connectDB()

  const app = createApp()
  const server = app.listen(env.port, () => {
    console.log(`LeadFlow API listening on http://localhost:${env.port}/api/v1 (${env.nodeEnv})`)
  })

  server.on('error', (err) => {
    console.error(err.code === 'EADDRINUSE' ? `Port ${env.port} is already in use. Change PORT in .env.` : err.message)
    process.exit(1)
  })

  // Stop cleanly on Ctrl+C / deploy restarts: finish in-flight requests, close the DB
  let closing = false
  const shutdown = async (signal) => {
    if (closing) return
    closing = true
    console.log(`${signal} received, shutting down`)
    server.close(async () => {
      await disconnectDB()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10_000).unref() // force exit if something hangs
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
