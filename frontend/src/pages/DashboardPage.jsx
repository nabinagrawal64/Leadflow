import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Plus, TrendingUp, Users } from 'lucide-react'
import clsx from 'clsx'
import { activitiesApi, dashboardApi, leadsApi } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { STAGES, STAGE_BAR } from '../lib/constants'
import { formatDateTime, isOverdue, leadIdOf, leadOf } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import { ErrorState, EmptyState, Skeleton } from '../components/ui/States'

function StatCard({ label, value, icon: Icon, tone, to, loading }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  return (
    <Link
      to={to}
      className="group rounded-xl border border-line bg-white p-5 transition-colors duration-150 hover:border-brand-500"
    >
      <div className="flex min-h-10 items-start justify-between gap-2">
        <span className="pt-1.5 text-sm font-semibold leading-tight text-ink-soft">{label}</span>
        <span className={clsx('flex size-9 items-center justify-center rounded-lg', tones[tone])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-16" />
      ) : (
        <p className="mt-2 font-display text-3xl font-semibold text-ink">{value ?? 0}</p>
      )}
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const summary = useAsync(() => dashboardApi.summary(), [])
  const leads = useAsync(() => leadsApi.list(), [])
  const followUps = useAsync(() => activitiesApi.list({ status: 'Pending' }), [])

  const s = summary.data || {}
  const leadList = leads.data || []
  const upcoming = [...(followUps.data || [])]
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .slice(0, 5)

  const stageCounts = STAGES.map((stage) => ({ stage, count: leadList.filter((l) => l.stage === stage).length }))
  const maxCount = Math.max(1, ...stageCounts.map((x) => x.count))

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        description="Here is where your pipeline stands today."
        actions={
          <Link to="/leads/new">
            <Button><Plus className="size-4" aria-hidden /> New lead</Button>
          </Link>
        }
      />

      {summary.error ? (
        <div className="rounded-xl border border-line bg-white">
          <ErrorState message={summary.error} onRetry={summary.reload} />
        </div>
      ) : (
        <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <StatCard loading={summary.loading} label="Total leads" value={s.totalLeads} icon={Users} tone="brand" to="/leads" />
          <StatCard loading={summary.loading} label="Active leads" value={s.activeLeads} icon={TrendingUp} tone="sky" to="/leads" />
          <StatCard loading={summary.loading} label="Won" value={s.wonLeads} icon={CheckCircle2} tone="emerald" to="/leads?stage=Won" />
          <StatCard loading={summary.loading} label="Pending follow-ups" value={s.pendingFollowUps} icon={CalendarClock} tone="amber" to="/follow-ups?status=Pending" />
          <StatCard loading={summary.loading} label="Overdue" value={s.overdueFollowUps} icon={AlertTriangle} tone="rose" to="/follow-ups?status=Pending" />
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Pipeline breakdown */}
        <section className="rounded-xl border border-line bg-white lg:col-span-2" aria-labelledby="pipeline-h">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="pipeline-h" className="text-base font-semibold">Pipeline</h2>
            <Link to="/leads" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              View leads <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="p-5">
            {leads.error ? (
              <ErrorState message={leads.error} onRetry={leads.reload} />
            ) : leads.loading ? (
              <div className="space-y-4">{STAGES.map((x) => <Skeleton key={x} className="h-6" />)}</div>
            ) : leadList.length === 0 ? (
              <EmptyState icon={Users} title="No leads yet" description="Add your first lead to see your pipeline take shape." />
            ) : (
              <ul className="space-y-4">
                {stageCounts.map(({ stage, count }) => (
                  <li key={stage}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <Link to={`/leads?stage=${encodeURIComponent(stage)}`} className="font-semibold text-slate-700 hover:text-brand-600">
                        {stage}
                      </Link>
                      <span className="font-semibold tabular-nums text-ink">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={clsx('h-full rounded-full transition-all duration-500', STAGE_BAR[stage])}
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Upcoming follow-ups */}
        <section className="rounded-xl border border-line bg-white lg:col-span-3" aria-labelledby="up-h">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="up-h" className="text-base font-semibold">Next follow-ups</h2>
            <Link to="/follow-ups" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {followUps.error ? (
            <ErrorState message={followUps.error} onRetry={followUps.reload} />
          ) : followUps.loading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="You're all caught up" description="No pending follow-ups. Schedule one from any lead." />
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((a) => {
                const lead = leadOf(a)
                const overdue = isOverdue(a)
                return (
                  <li key={a._id}>
                    <Link to={`/leads/${leadIdOf(a)}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50">
                      <span className={clsx('flex size-9 shrink-0 items-center justify-center rounded-lg', overdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600')}>
                        <CalendarClock className="size-[18px]" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{a.title}</p>
                        <p className="truncate text-xs text-ink-soft">{lead?.name || 'Lead'} · {a.type}</p>
                      </div>
                      <span className={clsx('shrink-0 text-xs font-semibold', overdue ? 'text-rose-600' : 'text-ink-soft')}>
                        {overdue ? 'Overdue · ' : ''}{formatDateTime(a.dueAt)}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
