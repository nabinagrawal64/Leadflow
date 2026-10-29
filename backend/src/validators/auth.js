import { z } from 'zod'
import { EMAIL_REGEX } from '../constants/index.js'
import { requiredText } from './common.js'

const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .regex(EMAIL_REGEX, 'Enter a valid email address')
  .max(254, 'Email is too long')

export const registerBody = z.strictObject({
  name: requiredText('Name', 80),
  email,
  // bcrypt only uses the first 72 bytes, so longer passwords are rejected instead of silently cut
  password: z.string({ error: 'Password is required' }).min(8, 'Use at least 8 characters').max(72, 'Password must be 72 characters or fewer'),
})

export const loginBody = z.strictObject({
  email,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(72, 'Password must be 72 characters or fewer'),
})
