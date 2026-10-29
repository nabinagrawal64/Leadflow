// Single source of truth for allowed values.
// These mirror frontend/src/lib/constants.js; keep the two in sync.

export const ROLES = ['admin']

export const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']
export const DEFAULT_STAGE = 'New'
// Won and Lost are closed; every other stage counts as "active"
export const CLOSED_STAGES = ['Won', 'Lost']

export const SOURCES = ['Website', 'Referral', 'Social Media', 'Email', 'Direct Outreach', 'Other']
export const SERVICES = ['Web Development', 'Digital Marketing', 'SEO', 'Branding', 'Other']

export const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Task']
export const ACTIVITY_STATUSES = ['Pending', 'Completed']

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
