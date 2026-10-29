import mongoose from 'mongoose'
import { DEFAULT_STAGE, EMAIL_REGEX, SERVICES, SOURCES, STAGES } from '../constants/index.js'
import { Activity } from './Activity.js'

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name must be 120 characters or fewer'],
    },
    company: { type: String, trim: true, maxlength: [120, 'Company must be 120 characters or fewer'] },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      // Optional, but must be valid when present
      validate: {
        validator: (v) => v == null || v === '' || EMAIL_REGEX.test(v),
        message: 'Enter a valid email address',
      },
    },
    phone: { type: String, trim: true, maxlength: [30, 'Phone must be 30 characters or fewer'] },
    source: { type: String, enum: { values: SOURCES, message: 'Source must be one of: ' + SOURCES.join(', ') } },
    serviceInterest: {
      type: String,
      enum: { values: SERVICES, message: 'Service interest must be one of: ' + SERVICES.join(', ') },
    },
    budget: { type: Number, min: [0, 'Budget cannot be negative'] },
    stage: {
      type: String,
      enum: { values: STAGES, message: 'Stage must be one of: ' + STAGES.join(', ') },
      default: DEFAULT_STAGE,
    },
    // Set by the server from the authenticated user; never read from a request body.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  },
)

// Business rule: at least one way to contact the lead.
// Checked on create/save. Update controllers must re-check the merged document (see README).
leadSchema.pre('validate', function () {
  if (!this.email && !this.phone) {
    this.invalidate('email', 'Provide an email or a phone number')
    this.invalidate('phone', 'Provide an email or a phone number')
  }
})

// Fast filtering by owner + stage, newest first (the leads list and dashboard counts)
leadSchema.index({ createdBy: 1, stage: 1, createdAt: -1 })

// Deleting a lead deletes its follow-ups too (assignment section 4, "Data integrity")
async function removeActivities(lead) {
  if (lead) await Activity.deleteMany({ leadId: lead._id })
}
leadSchema.post('findOneAndDelete', removeActivities)
leadSchema.post('deleteOne', { document: true, query: false }, async function () {
  await removeActivities(this)
})

export const Lead = mongoose.model('Lead', leadSchema)
