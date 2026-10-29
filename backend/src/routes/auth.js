import { Router } from 'express'
import { login, me, register } from '../controllers/auth.js'
import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { loginBody, registerBody } from '../validators/auth.js'

const router = Router()

router.post('/register', validate({ body: registerBody }), register)
router.post('/login', validate({ body: loginBody }), login)
router.get('/me', protect, me)

export default router
