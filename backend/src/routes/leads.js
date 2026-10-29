import { Router } from 'express'
import { createLead, deleteLead, getLead, listLeads, updateLead } from '../controllers/lead.js'
import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { idParams } from '../validators/common.js'
import { createLeadBody, listLeadsQuery, updateLeadBody } from '../validators/lead.js'

const router = Router()
router.use(protect)

router.get('/', validate({ query: listLeadsQuery }), listLeads)
router.post('/', validate({ body: createLeadBody }), createLead)
router.get('/:id', validate({ params: idParams }), getLead)
router.patch('/:id', validate({ params: idParams, body: updateLeadBody }), updateLead)
router.delete('/:id', validate({ params: idParams }), deleteLead)

export default router
