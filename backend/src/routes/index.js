import { Router } from 'express'
import activities from './activities.js'
import auth from './auth.js'
import dashboard from './dashboard.js'
import health from './health.js'
import leads from './leads.js'

const router = Router()

router.use('/health', health)
router.use('/auth', auth)
router.use('/leads', leads)
router.use('/activities', activities)
router.use('/dashboard', dashboard)

export default router
