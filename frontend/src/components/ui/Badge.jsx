import clsx from 'clsx'
import { STAGE_STYLES } from '../../lib/constants'

const base = 'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset'

export function StageBadge({ stage }) {
  return <span className={clsx(base, STAGE_STYLES[stage] || STAGE_STYLES.New)}>{stage}</span>
}

export function StatusBadge({ status, overdue }) {
  if (overdue) return <span className={clsx(base, 'bg-rose-50 text-rose-700 ring-rose-200')}>Overdue</span>
  return (
    <span
      className={clsx(
        base,
        status === 'Completed'
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-amber-50 text-amber-800 ring-amber-200',
      )}
    >
      {status}
    </span>
  )
}
