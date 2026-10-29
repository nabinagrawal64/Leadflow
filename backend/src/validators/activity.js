import { z } from 'zod'
import { ACTIVITY_STATUSES, ACTIVITY_TYPES } from '../constants/index.js'
import { NO_FIELDS, objectId, rejectEmpty, requiredText } from './common.js'

const oneOf = (label, values) => z.enum(values, { error: `${label} must be one of: ${values.join(', ')}` })

// ISO 8601 with a timezone, e.g. 2026-11-02T09:30:00.000Z. Stored and compared in UTC.
const dueAt = z.iso.datetime({ offset: true, error: 'Due date and time must be a valid ISO 8601 date-time' }).transform((v) => new Date(v))

export const createActivityBody = z.strictObject({
  leadId: objectId('Lead'),
  title: requiredText('Title', 160),
  type: oneOf('Type', ACTIVITY_TYPES).optional(),
  dueAt,
})

// leadId is deliberately absent: a follow-up cannot be moved to another lead.
export const updateActivityBody = z
  .strictObject({
    title: requiredText('Title', 160),
    type: oneOf('Type', ACTIVITY_TYPES),
    status: oneOf('Status', ACTIVITY_STATUSES),
    dueAt,
  })
  .partial()
  .refine(rejectEmpty, NO_FIELDS)

export const listActivitiesQuery = z.object({
  status: oneOf('Status', ACTIVITY_STATUSES).optional(),
  leadId: objectId('Lead').optional(),
})
