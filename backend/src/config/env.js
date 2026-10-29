// Reads and validates environment variables once, at startup.
// Failing fast here gives a clear message instead of a confusing crash later.

const errors = []

const required = (name) => {
  const value = process.env[name]?.trim()
  if (!value) errors.push(`${name} is missing`)
  return value
}

const port = Number(process.env.PORT || 5000)
if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('PORT must be a number between 1 and 65535')

const mongoUri = required('MONGODB_URI')
if (mongoUri && !/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
  errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://')
}
if (mongoUri && /<db_password>|<db_user>|<cluster-host>/.test(mongoUri)) {
  errors.push('MONGODB_URI still contains placeholders. Paste your real Atlas connection string')
}

const jwtSecret = required('JWT_SECRET')
if (jwtSecret && jwtSecret.length < 32) errors.push('JWT_SECRET must be at least 32 characters')
if (jwtSecret && /^replace-with/i.test(jwtSecret)) errors.push('JWT_SECRET is still the placeholder. Generate a real one (see .env.example)')

const bcryptRounds = Number(process.env.BCRYPT_ROUNDS || 12)
if (!Number.isInteger(bcryptRounds) || bcryptRounds < 4 || bcryptRounds > 15) errors.push('BCRYPT_ROUNDS must be a whole number from 4 to 15')

if (errors.length) {
  // Print the problems, never the values (the URI contains a password).
  console.error('Invalid environment configuration:\n' + errors.map((e) => `  - ${e}`).join('\n'))
  console.error('\nCopy .env.example to .env and fill it in.')
  process.exit(1)
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port,
  clientOrigin: process.env.CLIENT_ORIGIN?.trim() || 'http://localhost:5173',
  mongoUri,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || '1d',
  bcryptRounds,
})
