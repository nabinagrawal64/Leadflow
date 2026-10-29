import clsx from 'clsx'
import { dayOfMonth, monthShort } from '../lib/format'

/** Calendar-style tile: the day is the first thing you scan for in a follow-up. */
export default function DateTile({ value, tone = 'default', className }) {
  return (
    <div
      className={clsx(
        'flex w-14 shrink-0 flex-col items-center rounded-xl py-2 text-center',
        tone === 'danger' && 'tint-danger border',
        tone === 'done' && 'bg-sunk text-faint',
        tone === 'default' && 'bg-sunk text-ink',
        className,
      )}
      aria-hidden
    >
      <span className="font-display text-[22px] font-bold leading-none tabular-nums">{dayOfMonth(value)}</span>
      <span className="mt-1 text-xs font-semibold opacity-80">{monthShort(value)}</span>
    </div>
  )
}
