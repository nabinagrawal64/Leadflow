import { ApiError } from './errorHandler.js'

const toErrors = (issues) =>
  issues.map((i) => ({
    // strict objects report unknown keys on the parent, so surface the key name itself
    field: i.code === 'unrecognized_keys' ? i.keys[0] : i.path.join('.') || 'body',
    message: i.code === 'unrecognized_keys' ? `Field is not allowed: ${i.keys.join(', ')}` : i.message,
  }))

/**
 * validate({ params, query, body }) checks each part of the request against a zod schema.
 * On success the cleaned values are on req.valid (req.query is read-only in Express 5).
 * On failure it responds 400 { success:false, message:'Validation failed', errors:[{field,message}] }.
 */
export const validate = (schemas) => (req, _res, next) => {
  const valid = {}
  const errors = []
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue
    const result = schemas[part].safeParse(req[part] ?? {})
    if (result.success) valid[part] = result.data
    else errors.push(...toErrors(result.error.issues))
  }
  if (errors.length) return next(new ApiError(400, 'Validation failed', errors))
  req.valid = valid
  next()
}
