import { Router } from 'express'
import mongoose from 'mongoose'

const router = Router()

const DB_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }

// GET /api/v1/health: liveness plus database state. Exposes no secrets or config.
router.get('/', (_req, res) => {
  const db = DB_STATES[mongoose.connection.readyState] || 'unknown'
  const healthy = db === 'connected'
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'OK' : 'Database not connected',
    data: { status: healthy ? 'up' : 'degraded', database: db, uptimeSeconds: Math.round(process.uptime()) },
  })
})

export default router
