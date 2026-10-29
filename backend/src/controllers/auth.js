import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { User } from '../models/index.js'
import { ApiError } from '../middleware/errorHandler.js'
import { sendSuccess } from '../utils/response.js'
import { signToken } from '../utils/token.js'

// Compared against when the email is unknown, so "no such user" and "wrong password"
// take the same time and return the same message (no account enumeration by timing or text).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', env.bcryptRounds)

const session = (user) => ({ token: signToken(user._id), user: user.toJSON() })

// POST /auth/register
export async function register(req, res) {
  const { name, email, password } = req.valid.body

  if (await User.exists({ email })) {
    throw new ApiError(409, 'Email already registered', [{ field: 'email', message: 'Email already registered' }])
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds)
  const user = await User.create({ name, email, passwordHash })
  sendSuccess(res, session(user), 'Registered', 201)
}

// POST /auth/login
export async function login(req, res) {
  const { email, password } = req.valid.body

  const user = await User.findOne({ email }).select('+passwordHash')
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !matches) throw new ApiError(401, 'Invalid email or password')

  sendSuccess(res, session(user), 'Logged in')
}

// GET /auth/me
export function me(req, res) {
  sendSuccess(res, { user: req.user.toJSON() })
}
