import { User } from '../models/index.js'
import { verifyToken } from '../utils/token.js'
import { ApiError } from './errorHandler.js'

/**
 * Protects a route. Requires "Authorization: Bearer <jwt>", verifies the signature and
 * expiry, confirms the user still exists, and sets req.user. The user id for every
 * later ownership check comes from here, never from the request body.
 */
export async function protect(req, _res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required')

  let payload
  try {
    payload = verifyToken(token)
  } catch (err) {
    throw new ApiError(401, err.name === 'TokenExpiredError' ? 'Session expired. Please log in again' : 'Invalid token')
  }

  const user = await User.findById(payload.sub) // passwordHash is select:false, so it is not loaded
  if (!user) throw new ApiError(401, 'Invalid token')

  req.user = user
  next()
}
