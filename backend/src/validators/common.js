import { z } from 'zod'

export const objectId = (label = 'id') =>
  z.string({ error: `${label} is required` }).regex(/^[a-f\d]{24}$/i, `${label} is not a valid id`)

export const idParams = z.object({ id: objectId('id') })

/** Required text: trimmed, non-empty, length-limited. */
export const requiredText = (label, max) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`)

/** Optional text. An empty string or null means "no value" (and clears the field on update). */
export const optionalText = (label, max) =>
  z
    .string({ error: `${label} must be text` })
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .nullish()
    .transform((v) => (v ? v : null))

export const rejectEmpty = (data) => Object.keys(data).length > 0
export const NO_FIELDS = 'Provide at least one field to update'
