// Values mirror the data model in the assignment (section 4).

export const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']

export const SOURCES = ['Website', 'Referral', 'Social Media', 'Email', 'Direct Outreach', 'Other']

export const SERVICES = ['Web Development', 'Digital Marketing', 'SEO', 'Branding', 'Other']

export const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Task']

export const ACTIVITY_STATUSES = ['Pending', 'Completed']

// Won and Lost leads are closed; everything else is "active".
export const isActiveStage = (stage) => stage !== 'Won' && stage !== 'Lost'

export const STAGE_STYLES = {
  New: 'bg-slate-100 text-slate-700 ring-slate-200',
  Contacted: 'bg-sky-50 text-sky-700 ring-sky-200',
  Qualified: 'bg-violet-50 text-violet-700 ring-violet-200',
  'Proposal Sent': 'bg-amber-50 text-amber-800 ring-amber-200',
  Won: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Lost: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export const STAGE_BAR = {
  New: 'bg-slate-400',
  Contacted: 'bg-sky-500',
  Qualified: 'bg-violet-500',
  'Proposal Sent': 'bg-amber-500',
  Won: 'bg-emerald-500',
  Lost: 'bg-rose-500',
}
