import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarCheck, CalendarPlus } from 'lucide-react'
import clsx from 'clsx'
import { activitiesApi, parseApiError } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { isOverdue } from '../lib/format'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/States'
import FollowUpModal from '../components/FollowUpModal'
import FollowUpRow from '../components/FollowUpRow'

const TABS = [
  { value: '', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
]

export default function FollowUpsPage() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const status = TABS.some((t) => t.value === params.get('status')) ? params.get('status') : ''

  const { data, loading, error, reload } = useAsync(
    () => activitiesApi.list(status ? { status } : undefined),
    [status],
  )

  const [showModal, setShowModal] = useState(false)
  const [completingId, setCompletingId] = useState(null)
  const [reopeningId, setReopeningId] = useState(null)

  // Pending first (soonest due on top), then completed (most recent first)
  const items = [...(data || [])].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Pending' ? -1 : 1
    return a.status === 'Pending' ? new Date(a.dueAt) - new Date(b.dueAt) : new Date(b.dueAt) - new Date(a.dueAt)
  })
  const overdueCount = items.filter(isOverdue).length

  const complete = async (activity) => {
    setCompletingId(activity._id)
    try {
      await activitiesApi.update(activity._id, { status: 'Completed' })
      toast.success('Follow-up marked complete')
      reload()
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
      reload()
    } catch (err) {
      toast.error(parseApiError(err).message)
    } finally {
      setReopeningId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Follow-ups"
        description={overdueCount > 0 ? `${overdueCount} overdue. Start with those.` : 'Everything you have scheduled with your leads.'}
        actions={
          <Button onClick={() => setShowModal(true)}><CalendarPlus className="size-4" aria-hidden /> New follow-up</Button>
        }
      />

      {/* Segmented filter */}
      <div className="mb-4 md:w-fit w-full inline-flex rounded-full bg-sunk p-1 ring-1 ring-line" role="tablist" aria-label="Filter follow-ups by status">
        {TABS.map((t) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={status === t.value}
            onClick={() => setParams(t.value ? { status: t.value } : {}, { replace: true })}
            className={clsx(
              'rounded-full px-5 mx-auto py-2 text-sm font-semibold transition-colors duration-150',
              status === t.value ? 'bg-surface text-ink shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-surface">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !data ? (
          <TableSkeleton rows={5} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={status === 'Completed' ? 'Nothing completed yet' : status === 'Pending' ? 'No pending follow-ups' : 'No follow-ups yet'}
            description="Schedule a call, email or meeting to keep every lead moving."
            action={<Button onClick={() => setShowModal(true)}><CalendarPlus className="size-4" aria-hidden /> Schedule a follow-up</Button>}
          />
        ) : (
          <ul className={clsx('divide-y divide-line transition-opacity', loading && 'opacity-60')}>
            {items.map((a) => (
              <FollowUpRow
                key={a._id}
                activity={a}
                onComplete={complete}
                completing={completingId === a._id}
                onReopen={reopen}
                reopening={reopeningId === a._id}
              />
            ))}
          </ul>
        )}
      </div>

      <FollowUpModal open={showModal} onClose={() => setShowModal(false)} onCreated={reload} />
    </>
  )
}
