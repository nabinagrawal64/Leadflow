// All times are stored in UTC by the API and shown in the viewer's local timezone.

const dateTime = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const dateOnly = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const formatDateTime = (value) => (value ? dateTime.format(new Date(value)) : '—')
export const formatDate = (value) => (value ? dateOnly.format(new Date(value)) : '—')
export const formatBudget = (value) => (value === null || value === undefined || value === '' ? '—' : currency.format(value))

// Pending and past due. Completed items are never overdue.
export const isOverdue = (activity) =>
  activity.status === 'Pending' && new Date(activity.dueAt).getTime() < Date.now()

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time
export const toLocalInput = (value) => {
  const d = value ? new Date(value) : new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?'

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// follow-up.leadId may be a populated object or a bare id
export const leadOf = (activity) =>
  activity.leadId && typeof activity.leadId === 'object' ? activity.leadId : activity.lead || null
export const leadIdOf = (activity) =>
  activity.leadId && typeof activity.leadId === 'object' ? activity.leadId._id : activity.leadId
