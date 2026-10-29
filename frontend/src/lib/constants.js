// Values mirror the data model in the assignment (section 4).

export const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']

export const SOURCES = ['Website', 'Referral', 'Social Media', 'Email', 'Direct Outreach', 'Other']

export const SERVICES = ['Web Development', 'Digital Marketing', 'SEO', 'Branding', 'Other']

export const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Task']

export const ACTIVITY_STATUSES = ['Pending', 'Completed']

// Won and Lost leads are closed; everything else is "active".
export const isActiveStage = (stage) => stage !== 'Won' && stage !== 'Lost'

// One colour per stage. It drives the chevrons, chips and the spectrum strip.
export const STAGE_COLOR = {
  New: '#6f78a3',
  Contacted: '#1c86f2',
  Qualified: '#6e52f5',
  'Proposal Sent': '#e8950a',
  Won: '#0e9f76',
  Lost: '#e03a48',
}

// Text colour that stays readable on a solid stage colour
export const STAGE_ON_COLOR = {
  New: '#ffffff',
  Contacted: '#ffffff',
  Qualified: '#ffffff',
  'Proposal Sent': '#101226',
  Won: '#ffffff',
  Lost: '#ffffff',
}

export const stageVars = (stage) => ({ '--c': STAGE_COLOR[stage] || STAGE_COLOR.New })

// Soft, stable avatar tints so people are easy to tell apart in a list
const AVATAR_TINTS = ['#1c86f2', '#6e52f5', '#0e9f76', '#e8950a', '#e03a48', '#6f78a3']
export const avatarVars = (name = '') => {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997
  return { '--c': AVATAR_TINTS[h % AVATAR_TINTS.length] }
}
