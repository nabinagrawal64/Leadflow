import { Router } from 'express'
import { summary } from '../controllers/dashboard.js'
import { protect } from '../middleware/auth.js'

const router = Router()
router.get('/summary', protect, summary)

export default router
