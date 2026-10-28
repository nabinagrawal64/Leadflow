import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { parseApiError } from '../lib/api'
import { SERVICES, SOURCES, STAGES } from '../lib/constants'
import { EMAIL_RE } from '../lib/format'
import Button from './ui/Button'
import { Input, Select } from './ui/Field'

const EMPTY = { name: '', company: '', email: '', phone: '', source: '', serviceInterest: '', budget: '', stage: 'New' }

const fromLead = (lead) => ({
  name: lead.name ?? '',
  company: lead.company ?? '',
  email: lead.email ?? '',
  phone: lead.phone ?? '',
  source: lead.source ?? '',
  serviceInterest: lead.serviceInterest ?? '',
  budget: lead.budget ?? '',
  stage: lead.stage ?? 'New',
})

// Mirrors the server rules (section 6). The server remains the source of truth.
function validate(v) {
  const e = {}
  if (!v.name.trim()) e.name = 'Name is required'
  if (!v.email.trim() && !v.phone.trim()) {
    e.email = 'Provide an email or a phone number'
    e.phone = 'Provide an email or a phone number'
  }
  if (v.email.trim() && !EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address'
  if (v.budget !== '' && (Number.isNaN(Number(v.budget)) || Number(v.budget) < 0)) e.budget = 'Budget cannot be negative'
  return e
}

/** Cleared optional fields become null on edit (so the API can unset them) and are omitted on create. */
function toPayload(v, isEdit) {
  const optional = (value) => (value.trim() ? value.trim() : isEdit ? null : undefined)
  const payload = {
    name: v.name.trim(),
    company: optional(v.company),
    email: v.email.trim() ? v.email.trim().toLowerCase() : isEdit ? null : undefined,
    phone: optional(v.phone),
    source: v.source || (isEdit ? null : undefined),
    serviceInterest: v.serviceInterest || (isEdit ? null : undefined),
    budget: v.budget === '' ? (isEdit ? null : undefined) : Number(v.budget),
    stage: v.stage,
  }
  return Object.fromEntries(Object.entries(payload).filter(([, val]) => val !== undefined))
}

export default function LeadForm({ lead, onSubmit, onCancel, submitLabel = 'Save lead' }) {
  const isEdit = Boolean(lead)
  const [values, setValues] = useState(lead ? fromLead(lead) : EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    setErrors((x) => ({ ...x, [field]: undefined, ...(field === 'email' || field === 'phone' ? { email: undefined, phone: undefined } : {}) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    try {
      await onSubmit(toPayload(values, isEdit))
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors((x) => ({ ...x, ...parsed.fieldErrors }))
      setFormError(parsed.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {formError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" required value={values.name} onChange={set('name')} error={errors.name} placeholder="Aarav Sharma" />
        <Input label="Company" value={values.company} onChange={set('company')} error={errors.company} placeholder="Northwind Pvt Ltd" />
        <Input label="Email" type="email" value={values.email} onChange={set('email')} error={errors.email} placeholder="aarav@northwind.com" />
        <Input label="Phone" type="tel" value={values.phone} onChange={set('phone')} error={errors.phone} placeholder="+91 98765 43210" />
        <Select label="Source" value={values.source} onChange={set('source')} error={errors.source} options={SOURCES} placeholder="Select source" />
        <Select label="Service interest" value={values.serviceInterest} onChange={set('serviceInterest')} error={errors.serviceInterest} options={SERVICES} placeholder="Select service" />
        <Input label="Budget (INR)" type="number" min="0" step="any" inputMode="decimal" value={values.budget} onChange={set('budget')} error={errors.budget} placeholder="50000" />
        <Select label="Stage" value={values.stage} onChange={set('stage')} error={errors.stage} options={STAGES} />
      </div>
      <p className="mt-3 text-xs text-slate-500">At least one of email or phone is required.</p>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" loading={submitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
