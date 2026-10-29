import { Activity, Lead } from '../models/index.js'
import { ApiError } from '../middleware/errorHandler.js'
import { sendSuccess } from '../utils/response.js'

// The lead is populated so the UI can show who each follow-up is for
const withLead = (query) => query.populate('leadId', 'name company')

async function findOwned(req) {
  const activity = await Activity.findOne({ _id: req.valid.params.id, createdBy: req.user._id })
  if (!activity) throw new ApiError(404, 'Follow-up not found')
  return activity
}

// GET /activities?status=&leadId=
export async function listActivities(req, res) {
  const { status, leadId } = req.valid.query
  const filter = { createdBy: req.user._id }
  if (status) filter.status = status
  if (leadId) filter.leadId = leadId
  sendSuccess(res, await withLead(Activity.find(filter).sort({ dueAt: 1 })))
}

// POST /activities
export async function createActivity(req, res) {
  const { leadId, ...rest } = req.valid.body

  // The lead must exist and belong to this user (assignment section 4, "Data integrity")
  if (!(await Lead.exists({ _id: leadId, createdBy: req.user._id }))) {
    throw new ApiError(404, 'Lead not found', [{ field: 'leadId', message: 'Lead not found' }])
  }

  const activity = await Activity.create({ ...rest, leadId, createdBy: req.user._id })
  await activity.populate('leadId', 'name company')
  sendSuccess(res, activity, 'Created', 201)
}

// PATCH /activities/:id  (edit fields, or mark complete with { status: "Completed" })
export async function updateActivity(req, res) {
  const activity = await findOwned(req)
  activity.set(req.valid.body)
  // save() runs the model hook that records completedAt on the server
  await activity.save()
  await activity.populate('leadId', 'name company')
  sendSuccess(res, activity, 'Updated')
}
