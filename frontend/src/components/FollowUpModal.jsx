import { useEffect, useState } from 'react'
import { activitiesApi, leadsApi, parseApiError } from '../lib/api'
import { ACTIVITY_TYPES } from '../lib/constants'
import { toLocalInput } from '../lib/format'
import { useToast } from '../context/ToastContext'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Alert from './ui/Alert'
import { Input, Select } from './ui/Field'

/**
 * Create a follow-up. Pass `leadId` when opened from a lead; otherwise the user picks a lead.
 */
export default function FollowUpModal({ open, onClose, onCreated, leadId }) {
  const toast = useToast()
  const [leads, setLeads] = useState([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [values, setValues] = useState({ leadId: leadId || '', title: '', type: 'Call', dueAt: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // reset every time the dialog opens; default due time is tomorrow, same hour
  useEffect(() => {
    if (!open) return
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000)
    tomorrow.setMinutes(0, 0, 0)
    setValues({ leadId: leadId || '', title: '', type: 'Call', dueAt: toLocalInput(tomorrow) })
    setErrors({})
    setFormError('')
  }, [open, leadId])

  useEffect(() => {
    if (!open || leadId) return
    setLeadsLoading(true)
    leadsApi
      .list()
      .then((data) => setLeads(data || []))
      .catch((err) => setFormError(parseApiError(err).message))
      .finally(() => setLeadsLoading(false))
  }, [open, leadId])

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    setErrors((x) => ({ ...x, [field]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setFormError('')
    const found = {}
    if (!values.leadId) found.leadId = 'Choose a lead'
    if (!values.title.trim()) found.title = 'Title is required'
    if (!values.dueAt || Number.isNaN(new Date(values.dueAt).getTime())) found.dueAt = 'Choose a valid date and time'
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    try {
      await activitiesApi.create({
        leadId: values.leadId,
        title: values.title.trim(),
        type: values.type,
        dueAt: new Date(values.dueAt).toISOString(),
      })
      toast.success('Follow-up scheduled')
      onCreated?.()
      onClose()
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors((x) => ({ ...x, ...parsed.fieldErrors }))
      setFormError(parsed.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title="Schedule follow-up"
      description="Set a reminder to reach out to this lead."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form="followup-form" loading={submitting}>Schedule</Button>
        </>
      }
    >
      <form id="followup-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}
        {!leadId && (
          <Select
            label="Lead"
            required
            value={values.leadId}
            onChange={set('leadId')}
            error={errors.leadId}
            disabled={leadsLoading}
            placeholder={leadsLoading ? 'Loading leads…' : 'Select a lead'}
            options={leads.map((l) => ({ value: l._id, label: l.company ? `${l.name} · ${l.company}` : l.name }))}
          />
        )}
        <Input label="Title" required value={values.title} onChange={set('title')} error={errors.title} placeholder="Intro call about website redesign" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Type" value={values.type} onChange={set('type')} error={errors.type} options={ACTIVITY_TYPES} />
          <Input label="Due date & time" required type="datetime-local" value={values.dueAt} onChange={set('dueAt')} error={errors.dueAt} />
        </div>
      </form>
    </Modal>
  )
}
