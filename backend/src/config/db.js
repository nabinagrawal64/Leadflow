import mongoose from 'mongoose'
import { env } from './env.js'

// Reject queries on fields that are not in the schema, so a typo or a crafted
// request cannot silently become a different query.
mongoose.set('strictQuery', true)

let listenersAttached = false

function attachListeners() {
  if (listenersAttached) return
  listenersAttached = true
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'))
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'))
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.name))
}

/** Connect to MongoDB (Atlas). Throws a short, friendly error if it cannot. */
export async function connectDB() {
  attachListeners()
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10_000, // give up after 10s instead of hanging
      maxPoolSize: 10,
    })
    console.log(`MongoDB connected (database: ${mongoose.connection.name})`)
  } catch (err) {
    throw new Error(explainConnectionError(err))
  }
}

export async function disconnectDB() {
  await mongoose.disconnect()
}

/** Turn driver errors into the thing the developer actually needs to fix. */
function explainConnectionError(err) {
  const msg = String(err?.message || '')
  if (/bad auth|authentication failed/i.test(msg)) {
    return 'MongoDB rejected the username or password. Check the database user in Atlas > Database Access (special characters in the password must be URL-encoded).'
  }
  if (/ENOTFOUND|querySrv|EAI_AGAIN/i.test(msg)) {
    return 'Could not resolve the Atlas host. Check the cluster address in MONGODB_URI and your internet connection.'
  }
  if (err?.name === 'MongooseServerSelectionError' || /ReplicaSetNoPrimary|Server selection timed out/i.test(msg)) {
    return 'Could not reach MongoDB Atlas. Add your IP address in Atlas > Network Access (or allow 0.0.0.0/0 for local testing) and check your connection.'
  }
  return `MongoDB connection failed: ${err?.name || 'Error'}`
}
