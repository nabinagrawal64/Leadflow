import { Router } from 'express'
import health from './health.js'

const router = Router()

router.use('/health', health)
// Next milestone: /auth, /leads, /activities, /dashboard

export default router
