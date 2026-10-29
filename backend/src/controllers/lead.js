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

// GET /leads?search=&stage=&source=&serviceInterest=&page=&limit=&sort=&order=&format=
export async function listLeads(req, res) {
  const { search, stage, source, serviceInterest, page, limit, sort, order, format } = req.valid.query
  const filter = { createdBy: req.user._id }
  if (stage) filter.stage = stage
  if (source) filter.source = source
  if (serviceInterest) filter.serviceInterest = serviceInterest
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ name: pattern }, { company: pattern }, { email: pattern }]
  }

  const sortField = sort || 'createdAt'
  const sortDir = order === 'asc' ? 1 : -1

  // CSV export: stream all matching records (no pagination)
  if (format === 'csv') {
    const leads = await Lead.find(filter).sort({ [sortField]: sortDir }).lean()
    const header = ['Name', 'Company', 'Email', 'Phone', 'Source', 'Service Interest', 'Budget', 'Stage', 'Created At']
    const escape = (v) => {
      if (v == null) return ''
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = leads.map((l) =>
      [l.name, l.company, l.email, l.phone, l.source, l.serviceInterest, l.budget, l.stage, l.createdAt?.toISOString()].map(escape).join(',')
    )
    const csv = [header.join(','), ...rows].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"')
    return res.send(csv)
  }

  // JSON with pagination
  const skip = (page - 1) * limit
  const [leads, total] = await Promise.all([
    Lead.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
  ])

  sendSuccess(res, {
    leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  })
}

// POST /leads
export async function createLead(req, res) {
  const data = Object.fromEntries(Object.entries(req.valid.body).filter(([, v]) => v !== null && v !== undefined))
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
    lead.set(field, value === null ? undefined : value)
  }
  await lead.save()
  sendSuccess(res, lead, 'Updated')
}

// DELETE /leads/:id
export async function deleteLead(req, res) {
  const deleted = await Lead.findOneAndDelete(owned(req, req.valid.params.id))
  if (!deleted) throw new ApiError(404, 'Lead not found')
  sendSuccess(res, {}, 'Deleted')
}
