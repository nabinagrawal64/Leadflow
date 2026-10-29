import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const ALGORITHM = 'HS256'

export const signToken = (userId) =>
  jwt.sign({}, env.jwtSecret, { algorithm: ALGORITHM, subject: String(userId), expiresIn: env.jwtExpiresIn })

// Pins the algorithm so a token cannot choose its own (e.g. "none"), and checks the expiry.
export const verifyToken = (token) => jwt.verify(token, env.jwtSecret, { algorithms: [ALGORITHM] })
