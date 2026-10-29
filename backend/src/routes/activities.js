import { Router } from 'express'
import { createActivity, listActivities, updateActivity } from '../controllers/activity.js'
import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createActivityBody, listActivitiesQuery, updateActivityBody } from '../validators/activity.js'
import { idParams } from '../validators/common.js'

const router = Router()
router.use(protect)

router.get('/', validate({ query: listActivitiesQuery }), listActivities)
router.post('/', validate({ body: createActivityBody }), createActivity)
router.patch('/:id', validate({ params: idParams, body: updateActivityBody }), updateActivity)

export default router
