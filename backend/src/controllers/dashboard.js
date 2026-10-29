import { Activity, Lead } from '../models/index.js'
import { CLOSED_STAGES } from '../constants/index.js'
import { sendSuccess } from '../utils/response.js'

// GET /dashboard/summary
// Every number is counted from the saved records of the signed-in user.
export async function summary(req, res) {
  const createdBy = req.user._id
  const now = new Date() // server time decides what is overdue

  const [totalLeads, activeLeads, wonLeads, pendingFollowUps, overdueFollowUps] = await Promise.all([
    Lead.countDocuments({ createdBy }),
    Lead.countDocuments({ createdBy, stage: { $nin: CLOSED_STAGES } }), // active = not Won, not Lost
    Lead.countDocuments({ createdBy, stage: 'Won' }),
    Activity.countDocuments({ createdBy, status: 'Pending' }),
    Activity.countDocuments({ createdBy, status: 'Pending', dueAt: { $lt: now } }), // completed are never overdue
  ])

  sendSuccess(res, { totalLeads, activeLeads, wonLeads, pendingFollowUps, overdueFollowUps })
}
