import { Link } from 'react-router-dom'
import { CalendarClock, ChevronRight, Plus, Users } from 'lucide-react'
import clsx from 'clsx'
import { activitiesApi, dashboardApi, leadsApi } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { STAGES, avatarVars } from '../lib/constants'
import { formatTime, greeting, initials, isOverdue, leadIdOf, leadOf } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import { StageBadge } from '../components/ui/Badge'
import { ErrorState, EmptyState, Skeleton } from '../components/ui/States'
import { PipelineChevrons } from '../components/StageChevrons'
import DateTile from '../components/DateTile'

function Stat({ label, value, to, loading, alert }) {
  return (
    <Link to={to} className="group block px-5 py-5 transition-colors duration-150 hover:bg-sunk sm:px-6">
      <span className="block text-sm font-semibold text-muted">{label}</span>
      {loading ? (
        <Skeleton className="mt-2 h-10 w-14" />
      ) : (
        <span
          className={clsx(
            'mt-1 block font-display text-[44px] font-bold leading-none tabular-nums',
            alert ? 'text-danger' : 'text-ink',
          )}
        >
          {value ?? 0}
        </span>
      )}
    </Link>
  )
}

function Section({ title, to, linkLabel, children }) {
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-baseline justify-between border-t-2 border-ink pt-4">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        {to && (
          <Link to={to} className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
            {linkLabel} <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const summary = useAsync(() => dashboardApi.summary(), [])
  const leads = useAsync(() => leadsApi.list(), [])
  const followUps = useAsync(() => activitiesApi.list({ status: 'Pending' }), [])

  const s = summary.data || {}
  const leadList = leads.data || []
  const upcoming = [...(followUps.data || [])].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)).slice(0, 5)
  const latest = [...leadList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  const counts = Object.fromEntries(STAGES.map((stage) => [stage, leadList.filter((l) => l.stage === stage).length]))
  const firstName = user?.name?.split(' ')[0] || 'there'

  // A one-line read on the day, built from the saved summary (no invented numbers)
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
  const blurb = summary.data
    ? s.totalLeads === 0
      ? 'Add your first lead to get the pipeline moving.'
      : `You have ${plural(s.activeLeads, 'active lead', 'active leads')}` +
        (s.overdueFollowUps > 0
          ? ` and ${plural(s.overdueFollowUps, 'overdue follow-up', 'overdue follow-ups')}.`
          : s.pendingFollowUps > 0
            ? ` and ${plural(s.pendingFollowUps, 'follow-up', 'follow-ups')} coming up.`
            : ', and nothing overdue.')
    : 'Loading your numbers…'

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={blurb}
        actions={
          <Link to="/leads/new">
            <Button><Plus className="size-4" aria-hidden /> New lead</Button>
          </Link>
        }
      />

      {/* Key metrics: one strip, divided by hairlines */}
      {summary.error ? (
        <div className="rounded-2xl border border-line bg-surface">
          <ErrorState message={summary.error} onRetry={summary.reload} />
        </div>
      ) : (
        <section
          aria-label="Key metrics"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-5 [&>*]:bg-surface [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1"
        >
          <Stat loading={summary.loading} label="Total leads" value={s.totalLeads} to="/leads" />
          <Stat loading={summary.loading} label="Active leads" value={s.activeLeads} to="/leads" />
          <Stat loading={summary.loading} label="Won" value={s.wonLeads} to="/leads?stage=Won" />
          <Stat loading={summary.loading} label="Pending follow-ups" value={s.pendingFollowUps} to="/follow-ups?status=Pending" />
          <Stat loading={summary.loading} label="Overdue" value={s.overdueFollowUps} to="/follow-ups?status=Pending" alert={s.overdueFollowUps > 0} />
        </section>
      )}

      {/* Pipeline: the signature element */}
      <section aria-label="Pipeline" className="mt-6 rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-ink">Pipeline</h2>
          <Link to="/leads" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
            Open leads <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        {leads.error ? (
          <ErrorState message={leads.error} onRetry={leads.reload} />
        ) : leads.loading && !leads.data ? (
          <Skeleton className="h-24 w-full" />
        ) : leadList.length === 0 ? (
          <EmptyState icon={Users} title="No leads yet" description="Add your first lead and watch it move across the pipeline." />
        ) : (
          <PipelineChevrons counts={counts} />
        )}
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.35fr_1fr]">
        <Section title="Next follow-ups" to="/follow-ups" linkLabel="All follow-ups">
          {followUps.error ? (
            <ErrorState message={followUps.error} onRetry={followUps.reload} />
          ) : followUps.loading && !followUps.data ? (
            <div className="space-y-3 py-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="You're all caught up" description="No pending follow-ups. Schedule one from any lead." />
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((a) => {
                const lead = leadOf(a)
                const overdue = isOverdue(a)
                return (
                  <li key={a._id}>
                    <Link
                      to={`/leads/${leadIdOf(a)}`}
                      className="-mx-3 flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-sunk"
                    >
                      <DateTile value={a.dueAt} tone={overdue ? 'danger' : 'default'} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-ink">{a.title}</p>
                        <p className="truncate text-[13px] text-muted">{lead?.name || 'Lead'}, {a.type.toLowerCase()} at {formatTime(a.dueAt)}</p>
                      </div>
                      {overdue && <span className="shrink-0 text-xs font-bold text-danger">Overdue</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        <Section title="Latest leads" to="/leads" linkLabel="All leads">
          {leads.error ? null : leads.loading && !leads.data ? (
            <div className="space-y-3 py-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : latest.length === 0 ? (
            <p className="py-8 text-sm text-muted">Leads you add will show up here.</p>
          ) : (
            <ul className="divide-y divide-line">
              {latest.map((l) => (
                <li key={l._id}>
                  <Link to={`/leads/${l._id}`} className="-mx-3 flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-sunk">
                    <span className="stage-chip flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={avatarVars(l.name)}>
                      {initials(l.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{l.name}</span>
                      <span className="block truncate text-[13px] text-muted">{l.company || l.email || l.phone}</span>
                    </span>
                    <StageBadge stage={l.stage} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  )
}
