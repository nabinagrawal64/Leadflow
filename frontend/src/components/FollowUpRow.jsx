import { Link } from 'react-router-dom'
import { CalendarClock, CheckCircle2, Mail, Phone, Users } from 'lucide-react'
import clsx from 'clsx'
import { formatDateTime, isOverdue, leadIdOf, leadOf } from '../lib/format'
import { StatusBadge } from './ui/Badge'
import Button from './ui/Button'

const TYPE_ICON = { Call: Phone, Email: Mail, Meeting: Users, Task: CalendarClock }

export default function FollowUpRow({ activity, showLead = true, onComplete, completing }) {
  const Icon = TYPE_ICON[activity.type] || CalendarClock
  const overdue = isOverdue(activity)
  const done = activity.status === 'Completed'
  const lead = leadOf(activity)

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <span
          className={clsx(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            done ? 'bg-emerald-50 text-emerald-600' : overdue ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600',
          )}
        >
          {done ? <CheckCircle2 className="size-5" aria-hidden /> : <Icon className="size-5" aria-hidden />}
        </span>
        <div className="min-w-0">
          <p className={clsx('truncate text-sm font-semibold', done ? 'text-slate-500 line-through' : 'text-ink')}>
            {activity.title}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
            {showLead && (
              <>
                <Link to={`/leads/${leadIdOf(activity)}`} className="font-semibold text-brand-600 hover:text-brand-700">
                  {lead?.name || 'View lead'}
                </Link>
                <span aria-hidden>·</span>
              </>
            )}
            <span>{activity.type}</span>
            <span aria-hidden>·</span>
            <span className={clsx(overdue && 'font-semibold text-rose-600')}>Due {formatDateTime(activity.dueAt)}</span>
            {done && activity.completedAt && (
              <>
                <span aria-hidden>·</span>
                <span>Done {formatDateTime(activity.completedAt)}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <StatusBadge status={activity.status} overdue={overdue} />
        {!done && (
          <Button size="sm" variant="secondary" loading={completing} onClick={() => onComplete(activity)}>
            <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
            Mark complete
          </Button>
        )}
      </div>
    </li>
  )
}
