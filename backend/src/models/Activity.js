import mongoose from 'mongoose'
import { ACTIVITY_STATUSES, ACTIVITY_TYPES } from '../constants/index.js'

// An "activity" is a follow-up task scheduled against a lead.
const activitySchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: [true, 'Lead is required'], index: true },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [160, 'Title must be 160 characters or fewer'],
    },
    type: {
      type: String,
      enum: { values: ACTIVITY_TYPES, message: 'Type must be one of: ' + ACTIVITY_TYPES.join(', ') },
      default: 'Task',
    },
    status: {
      type: String,
      enum: { values: ACTIVITY_STATUSES, message: 'Status must be one of: ' + ACTIVITY_STATUSES.join(', ') },
      default: 'Pending',
    },
    // Stored as a UTC instant. The UI converts to the viewer's timezone.
    dueAt: { type: Date, required: [true, 'Due date and time are required'] },
    // Recorded by the server when status becomes Completed, never trusted from the client
    completedAt: { type: Date },
    // Owner, copied from the authenticated user. Lets access checks avoid a join.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  },
)

// Keep status and completedAt consistent whenever a document is saved
activitySchema.pre('validate', function () {
  if (this.status === 'Completed' && !this.completedAt) this.completedAt = new Date()
  if (this.status === 'Pending') this.completedAt = undefined
})

// Overdue lookups: pending items for an owner by due date
activitySchema.index({ createdBy: 1, status: 1, dueAt: 1 })

export const Activity = mongoose.model('Activity', activitySchema)
