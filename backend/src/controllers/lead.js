import { Lead } from '../models/index.js'
import { ApiError } from '../middleware/errorHandler.js'
import { sendSuccess } from '../utils/response.js'

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Every query below is scoped to the signed-in user (createdBy). Someone else's lead is
// reported as 404, the same as a lead that does not exist, so ids cannot be probed.
const owned = (req, id) => ({ _id: id, createdBy: req.user._id })

async function findOwned(req) {
  const lead = await Lead.findOne(owned(req, req.valid.params.id))
  if (!lead) throw new ApiError(404, 'Lead not found')
  return lead
}

// GET /leads?search=&stage=
export async function listLeads(req, res) {
  const { search, stage } = req.valid.query
  const filter = { createdBy: req.user._id }
  if (stage) filter.stage = stage
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i') // escaped: user input is never a regex
    filter.$or = [{ name: pattern }, { company: pattern }]
  }
  const leads = await Lead.find(filter).sort({ createdAt: -1 })
  sendSuccess(res, leads)
}

// POST /leads
export async function createLead(req, res) {
  // Drop empty optionals so they are simply absent in the database
  const data = Object.fromEntries(Object.entries(req.valid.body).filter(([, v]) => v !== null && v !== undefined))
  // createdBy comes from the authenticated user, never from the body
  const lead = await Lead.create({ ...data, createdBy: req.user._id })
  sendSuccess(res, lead, 'Created', 201)
}

// GET /leads/:id
export async function getLead(req, res) {
  sendSuccess(res, await findOwned(req))
}

// PATCH /leads/:id
export async function updateLead(req, res) {
  const lead = await findOwned(req)
  for (const [field, value] of Object.entries(req.valid.body)) {
    lead.set(field, value === null ? undefined : value) // null clears an optional field
  }
  // save() (not findOneAndUpdate) so the model re-checks "email or phone" on the merged lead
  await lead.save()
  sendSuccess(res, lead, 'Updated')
}

// DELETE /leads/:id
export async function deleteLead(req, res) {
  // findOneAndDelete triggers the model hook that also deletes the lead's follow-ups
  const deleted = await Lead.findOneAndDelete(owned(req, req.valid.params.id))
  if (!deleted) throw new ApiError(404, 'Lead not found')
  sendSuccess(res, {}, 'Deleted')
}
