import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { STAGES, STAGE_COLOR, STAGE_ON_COLOR } from '../lib/constants'

const posOf = (i) => (STAGES.length === 1 ? 'only' : i === 0 ? 'first' : i === STAGES.length - 1 ? 'last' : 'mid')

/**
 * Dashboard pipeline: one chevron per stage, filled when it holds leads.
 * Each chevron links to the leads list filtered by that stage.
 */
export function PipelineChevrons({ counts }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-[600px]">
        {STAGES.map((stage, i) => {
          const n = counts[stage] || 0
          return (
            <Link
              key={stage}
              to={`/leads?stage=${encodeURIComponent(stage)}`}
              className="chev-slot"
              aria-label={`${stage}: ${n} ${n === 1 ? 'lead' : 'leads'}`}
            >
              <span
                className="chev"
                data-pos={posOf(i)}
                style={
                  n > 0
                    ? { background: STAGE_COLOR[stage], color: STAGE_ON_COLOR[stage] }
                    : { background: 'var(--sunk)', color: 'var(--faint)' }
                }
              >
                <span className="font-display text-[28px] font-bold leading-none tabular-nums">{n}</span>
              </span>
              <span className="mt-2.5 block truncate pl-3 text-[13px] font-semibold text-ink">{stage}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Lead detail: the same chevrons as a control. Click a stage to move the lead there.
 * Stages up to and including the current one are filled so progress reads at a glance.
 */
export function StageStepper({ value, onChange, disabled }) {
  const current = STAGES.indexOf(value)
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-[600px]" role="group" aria-label="Pipeline stage">
        {STAGES.map((stage, i) => {
          const isCurrent = i === current
          const passed = i < current
          const color = STAGE_COLOR[stage]
          return (
            <button
              key={stage}
              type="button"
              disabled={disabled}
              onClick={() => !isCurrent && onChange(stage)}
              aria-pressed={isCurrent}
              aria-label={`Move to ${stage}`}
              title={isCurrent ? `Current stage: ${stage}` : `Move to ${stage}`}
              className="chev-slot text-left"
            >
              <span
                className={clsx('chev', 'text-[13px] font-bold')}
                data-pos={posOf(i)}
                style={
                  isCurrent
                    ? { background: color, color: STAGE_ON_COLOR[stage], height: 52 }
                    : passed
                      ? { background: `color-mix(in srgb, ${color} 26%, transparent)`, color: 'var(--ink)', height: 52 }
                      : { background: 'var(--sunk)', color: 'var(--muted)', height: 52 }
                }
              >
                <span className="truncate">{stage}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
