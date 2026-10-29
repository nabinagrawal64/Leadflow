import { z } from 'zod'
import { EMAIL_REGEX, SERVICES, SOURCES, STAGES } from '../constants/index.js'
import { NO_FIELDS, optionalText, rejectEmpty, requiredText } from './common.js'

const oneOf = (label, values) => z.enum(values, { error: `${label} must be one of: ${values.join(', ')}` })

const optionalEmail = z
  .string({ error: 'Email must be text' })
  .trim()
  .toLowerCase()
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || EMAIL_REGEX.test(v), 'Enter a valid email address')

// Only these fields can ever be set from a request. _id, createdBy and the timestamps are
// not listed, so strictObject rejects any attempt to send them.
const fields = {
  name: requiredText('Name', 120),
  company: optionalText('Company', 120),
  email: optionalEmail,
  phone: optionalText('Phone', 30),
  source: oneOf('Source', SOURCES).nullish().transform((v) => v ?? null),
  serviceInterest: oneOf('Service interest', SERVICES).nullish().transform((v) => v ?? null),
  budget: z
    .number({ error: 'Budget must be a number' })
    .finite('Budget must be a number')
    .min(0, 'Budget cannot be negative')
    .nullish()
    .transform((v) => v ?? null),
  stage: oneOf('Stage', STAGES).optional(), // omitted on create means the model default (New)
}

export const createLeadBody = z.strictObject(fields)

export const updateLeadBody = z.strictObject(fields).partial().refine(rejectEmpty, NO_FIELDS)

export const listLeadsQuery = z.object({
  search: z.string().trim().max(100, 'Search is too long').optional(),
  stage: oneOf('Stage', STAGES).optional(),
})
