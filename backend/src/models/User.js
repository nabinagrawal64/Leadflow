import mongoose from 'mongoose'
import { EMAIL_REGEX, ROLES } from '../constants/index.js'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name must be 80 characters or fewer'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates a unique index; the DB enforces it even under race conditions
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, 'Enter a valid email address'],
    },
    // bcrypt hash only. Plain passwords are never stored.
    // select:false keeps it out of every query unless explicitly requested with .select('+passwordHash')
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    // Single-workspace demo: everyone is an admin
    role: { type: String, enum: ROLES, default: 'admin' },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      // Defence in depth: even if passwordHash was selected, it never reaches a response
      transform: (_doc, ret) => {
        delete ret.passwordHash
        return ret
      },
    },
  },
)

export const User = mongoose.model('User', userSchema)
