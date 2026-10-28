import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Briefcase, CalendarPlus, Mail, Pencil, Phone, Tag, Trash2, Wallet } from 'lucide-react'
import { activitiesApi, leadsApi, parseApiError } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { formatBudget, formatDate, initials, leadIdOf } from '../lib/format'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { EmptyState, ErrorState, Spinner } from '../components/ui/States'
import LeadForm from '../components/LeadForm'
import FollowUpModal from '../components/FollowUpModal'
import FollowUpRow from '../components/FollowUpRow'
import { StageSelect } from './LeadsPage'

const BackLink = () => (
  <Link to="/leads" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand-600">
    <ArrowLeft className="size-4" aria-hidden /> Back to leads
  </Link>
)

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="mt-0.5 break-words text-sm text-ink">{children || <span className="text-slate-400">Not provided</span>}</dd>
      </div>
    </div>
  )
}

/** /leads/new */
export function NewLeadPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const create = async (payload) => {
    const lead = await leadsApi.create(payload)
    toast.success('Lead created')
    navigate(`/leads/${lead._id}`, { replace: true })
  }

  return (
    <>
      <PageHeader back={<BackLink />} title="New lead" description="Capture a prospective client." />
      <div className="max-w-3xl rounded-xl border border-line bg-white p-5 sm:p-6">
        <LeadForm onSubmit={create} onCancel={() => navigate('/leads')} submitLabel="Create lead" />
      </div>
    </>
  )
}

/** /leads/:id  (add ?edit=1 to open straight in edit mode) */
export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const editing = params.get('edit') === '1'

  const lead = useAsync(() => leadsApi.get(id), [id])
  const followUps = useAsync(() => activitiesApi.list({ leadId: id }), [id])

  const [showFollowUp, setShowFollowUp] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [completingId, setCompletingId] = useState(null)

  const setEditing = (on) =>
    setParams(on ? { edit: '1' } : {}, { replace: true })

  const save = async (payload) => {
    await leadsApi.update(id, payload)
    toast.success('Lead updated')
    setEditing(false)
    lead.reload()
  }

  const remove = async () => {
    try {
      await leadsApi.remove(id)
      toast.success('Lead deleted')
      navigate('/leads', { replace: true })
    } catch (err) {
      toast.error(parseApiError(err).message)
      setShowDelete(false)
    }
  }

  const complete = async (activity) => {
    setCompletingId(activity._id)
    try {
      await activitiesApi.update(activity._id, { status: 'Completed' })
      toast.success('Follow-up marked complete')
      followUps.reload()
    } catch (err) {
      toast.error(parseApiError(err).message)
    } finally {
      setCompletingId(null)
    }
  }

  if (lead.loading && !lead.data) return <Spinner label="Loading lead…" />
  if (lead.error) {
    return (
      <>
        <BackLink />
        <div className="rounded-xl border border-line bg-white">
          <ErrorState message={lead.error} onRetry={lead.reload} />
        </div>
      </>
    )
  }

  const l = lead.data
  // Safety net: only show follow-ups that belong to this lead
  const items = (followUps.data || [])
    .filter((a) => leadIdOf(a) === id)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
  const pending = items.filter((a) => a.status === 'Pending')
  const completed = items.filter((a) => a.status === 'Completed')

  return (
    <>
      <PageHeader
        back={<BackLink />}
        title={l.name}
        description={l.company || 'No company on file'}
        actions={
          <>
            <StageSelect lead={l} onChanged={lead.reload} className="!h-10 !px-4 !text-sm" />
            {!editing && (
              <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="size-4" aria-hidden /> Edit</Button>
            )}
            <Button variant="secondary" className="!text-rose-600 hover:!bg-rose-50" onClick={() => setShowDelete(true)}>
              <Trash2 className="size-4" aria-hidden /> Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Lead information */}
        <section className="rounded-xl border border-line bg-white p-5 sm:p-6 lg:col-span-2" aria-label="Lead information">
          {editing ? (
            <>
              <h2 className="mb-5 text-base font-semibold">Edit lead</h2>
              <LeadForm lead={l} onSubmit={save} onCancel={() => setEditing(false)} submitLabel="Save changes" />
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3.5">
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-base font-bold text-brand-700">
                  {initials(l.name)}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">{l.name}</h2>
                  <p className="text-xs text-ink-soft">Added {formatDate(l.createdAt)}</p>
                </div>
              </div>
              <dl className="space-y-5">
                <Detail icon={Briefcase} label="Company">{l.company}</Detail>
                <Detail icon={Mail} label="Email">
                  {l.email && <a href={`mailto:${l.email}`} className="text-brand-600 hover:text-brand-700">{l.email}</a>}
                </Detail>
                <Detail icon={Phone} label="Phone">
                  {l.phone && <a href={`tel:${l.phone}`} className="text-brand-600 hover:text-brand-700">{l.phone}</a>}
                </Detail>
                <Detail icon={Tag} label="Source">{l.source}</Detail>
                <Detail icon={Briefcase} label="Service interest">{l.serviceInterest}</Detail>
                <Detail icon={Wallet} label="Budget">{l.budget != null ? formatBudget(l.budget) : null}</Detail>
              </dl>
            </>
          )}
        </section>

        {/* Follow-ups */}
        <section className="rounded-xl border border-line bg-white lg:col-span-3" aria-labelledby="fu-h">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="fu-h" className="text-base font-semibold">Follow-ups</h2>
            <Button size="sm" onClick={() => setShowFollowUp(true)}>
              <CalendarPlus className="size-4" aria-hidden /> Add follow-up
            </Button>
          </div>

          {followUps.error ? (
            <ErrorState message={followUps.error} onRetry={followUps.reload} />
          ) : followUps.loading && !followUps.data ? (
            <Spinner label="Loading follow-ups…" className="py-12" />
          ) : items.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="No follow-ups yet"
              description="Schedule a call, email or meeting so this lead never goes cold."
              action={<Button onClick={() => setShowFollowUp(true)}><CalendarPlus className="size-4" aria-hidden /> Schedule one</Button>}
            />
          ) : (
            <>
              {pending.length > 0 && (
                <ul className="divide-y divide-line">
                  {pending.map((a) => (
                    <FollowUpRow key={a._id} activity={a} showLead={false} onComplete={complete} completing={completingId === a._id} />
                  ))}
                </ul>
              )}
              {completed.length > 0 && (
                <>
                  <h3 className="border-y border-line bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Completed ({completed.length})
                  </h3>
                  <ul className="divide-y divide-line">
                    {completed.map((a) => <FollowUpRow key={a._id} activity={a} showLead={false} />)}
                  </ul>
                </>
              )}
            </>
          )}
        </section>
      </div>

      <FollowUpModal open={showFollowUp} onClose={() => setShowFollowUp(false)} onCreated={followUps.reload} leadId={id} />
      <ConfirmDialog
        open={showDelete}
        title="Delete this lead?"
        message={`“${l.name}” and all of its follow-ups will be permanently removed. This cannot be undone.`}
        onConfirm={remove}
        onClose={() => setShowDelete(false)}
      />
    </>
  )
}
