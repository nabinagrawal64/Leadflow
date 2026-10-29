import { Link } from 'react-router-dom'
import { ChevronRight, Plus, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { analyticsApi } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { STAGES, STAGE_COLOR, STAGE_ON_COLOR } from '../lib/constants'
import { formatBudget, formatMonth } from '../lib/format'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import { ErrorState, Skeleton } from '../components/ui/States'

function Stat({ label, value, sub, loading, alert }) {
  return (
    <div className="px-5 py-5 transition-colors duration-150 hover:bg-sunk sm:px-6">
      <span className="block text-sm font-semibold text-muted">{label}</span>
      {loading ? (
        <Skeleton className="mt-2 h-10 w-24" />
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
      {sub && <span className="mt-1 block text-xs text-muted">{sub}</span>}
    </div>
  )
}

function Section({ title, to, linkLabel, children }) {
  return (
    <section aria-label={title}>
      <div className="mb-4 flex items-baseline justify-between border-t-2 border-ink pt-4">
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

const posOf = (i) => (STAGES.length === 1 ? 'only' : i === 0 ? 'first' : i === STAGES.length - 1 ? 'last' : 'mid')

// ─── Visual Pipeline Chevron Funnel ───────────────────────────────────────────
function AnalyticsPipelineChevrons({ byStage, totalLeads }) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <div className="-mx-1 overflow-x-auto px-1 pb-2">
        <div className="flex min-w-[660px]">
          {STAGES.map((stage, i) => {
            const count = byStage[stage]?.count || 0
            const stageBudget = byStage[stage]?.totalBudget || 0
            const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0

            return (
              <Link
                key={stage}
                to={`/leads?stage=${encodeURIComponent(stage)}`}
                className="chev-slot text-left"
                aria-label={`${stage}: ${count} leads, ${pct}% of pipeline`}
              >
                <span
                  className="chev flex-col justify-center"
                  data-pos={posOf(i)}
                  style={
                    count > 0
                      ? { background: STAGE_COLOR[stage], color: STAGE_ON_COLOR[stage], height: 74 }
                      : { background: 'var(--sunk)', color: 'var(--faint)', height: 74 }
                  }
                >
                  <span className="font-display text-[30px] font-bold leading-none tabular-nums">{count}</span>
                  <span className="text-[11px] font-semibold opacity-90">{pct}%</span>
                </span>

                <div className="mt-3 pl-3 pr-2">
                  <span className="block truncate text-sm font-bold text-ink">{stage}</span>
                  <span className="block truncate text-xs font-semibold tabular-nums text-muted">
                    {stageBudget > 0 ? formatBudget(stageBudget) : '—'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Visual Monthly Bar Chart (No cluttered text) ─────────────────────────────
function MonthlyVisualChart({ monthlyLeads }) {
  if (!monthlyLeads?.length) {
    return <div className="py-12 text-center text-sm text-muted">No monthly data available yet.</div>
  }

  const max = Math.max(...monthlyLeads.map((m) => m.count), 1)

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex h-56 items-end gap-2 sm:gap-4 border-b border-line pb-3">
        {monthlyLeads.map((m, i) => {
          const heightPct = Math.round((m.count / max) * 100)
          const monthName = formatMonth(m).split(' ')[0]

          return (
            <div key={i} className="group flex flex-1 flex-col items-center justify-end h-full">
              <span className="font-display text-xs font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100 tabular-nums">
                {m.count}
              </span>
              <div className="relative w-full overflow-hidden rounded-t-xl bg-sunk" style={{ height: '100%' }}>
                <div
                  className="absolute bottom-0 inset-x-0 rounded-t-xl bg-primary transition-all duration-500 group-hover:bg-primary-hover"
                  style={{ height: `${Math.max(heightPct, 6)}%` }}
                />
              </div>
              <span className="mt-3 text-[11px] font-semibold text-muted group-hover:text-ink truncate">
                {monthName}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Visual Activity Ring Gauge ───────────────────────────────────────────────
function VisualActivityRing({ activities }) {
  const total = activities?.total || 0
  const completed = activities?.completed || 0
  const pending = total - completed
  const rate = activities?.completionRate ?? 0

  const r = 50
  const circ = 2 * Math.PI * r
  const fill = total > 0 ? (completed / total) * circ : 0

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <div className="relative size-44">
        <svg viewBox="0 0 120 120" className="size-44 -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--sunk)" strokeWidth="12" />
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke="var(--success)"
            strokeWidth="12"
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-4xl font-bold text-ink tabular-nums">{rate}%</span>
          <span className="text-xs font-semibold text-muted">Completed</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-success" />
          <span className="text-muted">Done:</span>
          <span className="font-bold text-ink tabular-nums">{completed}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-sunk ring-1 ring-line" />
          <span className="text-muted">Pending:</span>
          <span className="font-bold text-ink tabular-nums">{pending}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Visual Categorical Bars (Clean & Graphic) ────────────────────────────────
function VisualDistributionBars({ items, total, colors }) {
  const valid = (items || []).filter((i) => i.name && i.name !== 'Unknown')
  if (!valid.length) {
    return <div className="py-8 text-center text-sm text-muted">No distribution data</div>
  }

  const defaultPalette = ['#1c86f2', '#6e52f5', '#0e9f76', '#e8950a', '#e03a48', '#6f78a3']
  const palette = colors || defaultPalette

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 space-y-4">
      {valid.map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
        const color = palette[i % palette.length]

        return (
          <div key={item.name}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold text-ink">
                <span className="size-2 rounded-full" style={{ background: color }} />
                {item.name}
              </span>
              <span className="font-bold tabular-nums text-ink">{pct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-sunk">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(pct, 2)}%`, background: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Analytics Page ──────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { data, loading, error, reload } = useAsync(() => analyticsApi.get(), [])

  const d = data || {}
  const byStage = d.byStage || Object.fromEntries(STAGES.map((s) => [s, { count: 0, totalBudget: 0 }]))
  const bySource = d.bySource || []
  const byService = d.byService || []
  const monthlyLeads = d.monthlyLeads || []
  const activities = d.activities || {}

  const totalBudget = Object.values(byStage).reduce((s, v) => s + (v.totalBudget || 0), 0)
  const totalLeads = Object.values(byStage).reduce((s, v) => s + v.count, 0)
  const wonCount = byStage['Won']?.count || 0
  const winRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Pipeline conversion, lead velocity and operational metrics."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={reload} title="Refresh data">
              <RefreshCw className="size-4" aria-hidden /> Refresh
            </Button>
            <Link to="/leads/new">
              <Button size="sm">
                <Plus className="size-4" aria-hidden /> New lead
              </Button>
            </Link>
          </div>
        }
      />

      {/* Key Metrics Strip (Identical aesthetic to Dashboard) */}
      {error ? (
        <div className="rounded-2xl border border-line bg-surface">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : (
        <section
          aria-label="Executive numbers"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4 [&>*]:bg-surface"
        >
          <Stat
            loading={loading && !data}
            label="Total pipeline value"
            value={formatBudget(totalBudget)}
          />
          <Stat
            loading={loading && !data}
            label="Total leads"
            value={totalLeads}
          />
          <Stat
            loading={loading && !data}
            label="Pipeline win rate"
            value={`${winRate}%`}
            sub={`${wonCount} won deals`}
          />
          <Stat
            loading={loading && !data}
            label="Follow-up completion"
            value={`${activities.completionRate ?? 0}%`}
            sub={activities.avgCompletionDays != null ? `${activities.avgCompletionDays}d avg time` : undefined}
          />
        </section>
      )}

      {/* Signature Pipeline Section */}
      <div className="mt-8">
        <Section title="Pipeline by Stage" to="/leads" linkLabel="View all leads">
          {loading && !data ? (
            <Skeleton className="h-36 rounded-3xl" />
          ) : (
            <AnalyticsPipelineChevrons byStage={byStage} totalLeads={totalLeads} />
          )}
        </Section>
      </div>

      {/* Visual Intake & Velocity Section */}
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Lead Volume (Last 12 Months)" to="/leads" linkLabel="Leads list">
          {loading && !data ? (
            <Skeleton className="h-64 rounded-3xl" />
          ) : (
            <MonthlyVisualChart monthlyLeads={monthlyLeads} />
          )}
        </Section>

        <Section title="Follow-up Completion" to="/follow-ups" linkLabel="All follow-ups">
          {loading && !data ? (
            <Skeleton className="h-64 rounded-3xl" />
          ) : (
            <VisualActivityRing activities={activities} />
          )}
        </Section>
      </div>

      {/* Categorical Breakdown Sections */}
      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <Section title="Leads by Source">
          {loading && !data ? (
            <Skeleton className="h-56 rounded-3xl" />
          ) : (
            <VisualDistributionBars
              items={bySource}
              total={totalLeads}
              colors={['#1c86f2', '#6e52f5', '#0e9f76', '#e8950a', '#e03a48']}
            />
          )}
        </Section>

        <Section title="Service Demand">
          {loading && !data ? (
            <Skeleton className="h-56 rounded-3xl" />
          ) : (
            <VisualDistributionBars
              items={byService}
              total={totalLeads}
              colors={['#6e52f5', '#1c86f2', '#0e9f76', '#e8950a', '#e03a48']}
            />
          )}
        </Section>
      </div>
    </>
  )
}
