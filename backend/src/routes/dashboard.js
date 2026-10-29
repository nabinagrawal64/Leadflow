import { Router } from 'express'
import { summary } from '../controllers/dashboard.js'
import { analytics } from '../controllers/analytics.js'
import { protect } from '../middleware/auth.js'

const router = Router()
router.use(protect)
router.get('/summary', summary)
router.get('/analytics', analytics)

export default router
