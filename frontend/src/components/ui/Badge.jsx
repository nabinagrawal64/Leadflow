import clsx from 'clsx'
import { stageVars } from '../../lib/constants'

const base = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold'

export function StageBadge({ stage }) {
  return (
    <span className={clsx(base, 'stage-chip')} style={stageVars(stage)}>
      <span className="size-1.5 rounded-full" style={{ background: 'var(--c)' }} aria-hidden />
      {stage}
    </span>
  )
}

export function StatusBadge({ status, overdue }) {
  if (overdue) return <span className={clsx(base, 'border tint-danger')}>Overdue</span>
  if (status === 'Completed')
    return (
      <span className={clsx(base, 'stage-chip')} style={{ '--c': '#0e9f76' }}>
        Completed
      </span>
    )
  return (
    <span className={clsx(base, 'stage-chip')} style={{ '--c': '#e8950a' }}>
      Pending
    </span>
  )
}
