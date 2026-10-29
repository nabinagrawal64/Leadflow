import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Briefcase, CalendarPlus, CheckCircle2, Clock, Mail, Pencil, Phone, Tag, Trash2, Wallet } from 'lucide-react'
import clsx from 'clsx'
import { activitiesApi, leadsApi, parseApiError } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { formatBudget, formatDate, formatDateTime, isOverdue, leadIdOf } from '../lib/format'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { EmptyState, ErrorState, Spinner } from '../components/ui/States'
import LeadForm from '../components/LeadForm'
import FollowUpModal from '../components/FollowUpModal'
import FollowUpRow from '../components/FollowUpRow'
import { StageStepper } from '../components/StageChevrons'

// ─── Activity timeline ────────────────────────────────────────────────────────
function ActivityTimeline({ items }) {
  if (!items.length) return null
  // Chronological order for the timeline (oldest first)
  const chronological = [...items].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))

  return (
    <section aria-label="Activity timeline" className="mt-10">
      <h2 className="border-t-2 border-ink pt-4 text-xl font-bold">Activity timeline</h2>
      <div className="relative mt-6 pl-8">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-line" aria-hidden />
        <ol className="space-y-6">
          {chronological.map((a) => {
            const done = a.status === 'Completed'
            const overdue = isOverdue(a)
            return (
              <li key={a._id} className="relative flex gap-4">
                {/* Dot */}
                <div
                  className={clsx(
                    'absolute -left-8 flex size-5 items-center justify-center rounded-full border-2 border-surface ring-2',
                    done ? 'bg-success ring-success/30' : overdue ? 'bg-danger ring-danger/20' : 'bg-primary ring-primary/20',
                  )}
                  aria-hidden
                >
                  {done && <CheckCircle2 className="size-3 text-white" />}
                </div>
                {/* Card */}
                <div className={clsx(
                  'flex-1 rounded-2xl border border-line bg-surface p-4 transition-colors',
                  done && 'opacity-70',
                )}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className={clsx('text-[15px] font-semibold', done && 'line-through text-faint')}>{a.title}</p>
                    <span className={clsx(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                      done ? 'bg-success/10 text-success' : overdue ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary',
                    )}>
                      {done ? 'Done' : overdue ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
                    <span className="font-semibold">{a.type}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" aria-hidden />
                      {formatDateTime(a.dueAt)}
                    </span>
                    {done && a.completedAt && (
                      <span className="inline-flex items-center gap-1 text-success">
                        <CheckCircle2 className="size-3" aria-hidden />
                        Completed {formatDateTime(a.completedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

const BackLink = () => (
  <Link to="/leads" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-primary">
    <ArrowLeft className="size-4" aria-hidden /> Back to leads
  </Link>
)

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3.5 py-3.5">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-sunk text-muted">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-[13px] font-semibold text-muted">{label}</dt>
        <dd className="mt-0.5 break-words text-[15px] font-medium text-ink">{children || <span className="font-normal text-faint">Not provided</span>}</dd>
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
      <PageHeader back={<BackLink />} title="New lead" description="Capture a prospective client. Name and one way to reach them is enough to start." />
      <div className="max-w-3xl rounded-3xl border border-line bg-surface p-6 sm:p-8">
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
  const [reopeningId, setReopeningId] = useState(null)
  const [movingStage, setMovingStage] = useState(false)

  const setEditing = (on) => setParams(on ? { edit: '1' } : {}, { replace: true })

  const save = async (payload) => {
    await leadsApi.update(id, payload)
    toast.success('Lead updated')
    setEditing(false)
    lead.reload()
  }

  const changeStage = async (stage) => {
    setMovingStage(true)
    try {
      await leadsApi.update(id, { stage })
      toast.success(`Moved to ${stage}`)
      lead.reload()
    } catch (err) {
      toast.error(parseApiError(err).message)
    } finally {
      setMovingStage(false)
    }
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

  const reopen = async (activity) => {
    setReopeningId(activity._id)
    try {
      await activitiesApi.update(activity._id, { status: 'Pending' })
      toast.success('Follow-up reopened')
      followUps.reload()
    } catch (err) {
      toast.error(parseApiError(err).message)
    } finally {
      setReopeningId(null)
    }
  }

  if (lead.loading && !lead.data) return <Spinner label="Loading lead…" />
  if (lead.error) {
    return (
      <>
        <BackLink />
        <div className="rounded-3xl border border-line bg-surface">
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
        description={l.company ? `${l.company}, added ${formatDate(l.createdAt)}` : `Added ${formatDate(l.createdAt)}`}
        actions={
          <>
            {!editing && (
              <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="size-4" aria-hidden /> Edit</Button>
            )}
            <Button variant="secondary" className="!text-danger" onClick={() => setShowDelete(true)}>
              <Trash2 className="size-4" aria-hidden /> Delete
            </Button>
          </>
        }
      />

      {/* Stage control: the pipeline, as buttons */}
      <section aria-label="Pipeline stage" className="mb-8 rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <p className="mb-4 text-sm font-semibold text-muted">Stage: pick where this lead stands now</p>
        <StageStepper value={l.stage} onChange={changeStage} disabled={movingStage} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.45fr]">
        {/* Lead information */}
        <section aria-label="Lead information">
          {editing ? (
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
              <h2 className="mb-5 text-xl font-bold">Edit lead</h2>
              <LeadForm lead={l} onSubmit={save} onCancel={() => setEditing(false)} submitLabel="Save changes" />
            </div>
          ) : (
            <>
              <h2 className="border-t-2 border-ink pt-4 text-xl font-bold">Details</h2>
              <dl className="mt-2 divide-y divide-line">
                <Detail icon={Briefcase} label="Company">{l.company}</Detail>
                <Detail icon={Mail} label="Email">
                  {l.email && <a href={`mailto:${l.email}`} className="text-primary hover:underline">{l.email}</a>}
                </Detail>
                <Detail icon={Phone} label="Phone">
                  {l.phone && <a href={`tel:${l.phone}`} className="text-primary hover:underline">{l.phone}</a>}
                </Detail>
                <Detail icon={Tag} label="Source">{l.source}</Detail>
                <Detail icon={Briefcase} label="Service interest">{l.serviceInterest}</Detail>
                <Detail icon={Wallet} label="Budget">{l.budget != null ? formatBudget(l.budget) : null}</Detail>
              </dl>
            </>
          )}
        </section>

        {/* Follow-ups */}
        <section aria-labelledby="fu-h">
          <div className="flex items-center justify-between border-t-2 border-ink pt-4">
            <h2 id="fu-h" className="text-xl font-bold">Follow-ups</h2>
            <Button size="sm" onClick={() => setShowFollowUp(true)}>
              <CalendarPlus className="size-4" aria-hidden /> Add follow-up
            </Button>
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-surface">
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
                    <h3 className="border-y border-line bg-sunk px-5 py-2.5 text-[13px] font-semibold text-muted">
                      Completed ({completed.length})
                    </h3>
                    <ul className="divide-y divide-line">
                      {completed.map((a) => <FollowUpRow key={a._id} activity={a} showLead={false} onReopen={reopen} reopening={reopeningId === a._id} />)}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Full activity timeline */}
      {items.length > 0 && <ActivityTimeline items={items} />}

      <FollowUpModal open={showFollowUp} onClose={() => setShowFollowUp(false)} onCreated={followUps.reload} leadId={id} />
      <ConfirmDialog
        open={showDelete}
        title="Delete this lead?"
        message={`"${l.name}" and all of its follow-ups will be permanently removed. This cannot be undone.`}
        onConfirm={remove}
        onClose={() => setShowDelete(false)}
      />
    </>
  )
}
