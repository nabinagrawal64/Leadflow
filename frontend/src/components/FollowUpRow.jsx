import { Link } from 'react-router-dom'
import { CalendarClock, CheckCircle2, Clock, Mail, Phone, RotateCcw, Users } from 'lucide-react'
import clsx from 'clsx'
import { formatDateTime, formatTime, isOverdue, leadIdOf, leadOf } from '../lib/format'
import { StatusBadge } from './ui/Badge'
import Button from './ui/Button'
import DateTile from './DateTile'

const TYPE_ICON = { Call: Phone, Email: Mail, Meeting: Users, Task: CalendarClock }

export default function FollowUpRow({ activity, showLead = true, onComplete, completing, onReopen, reopening }) {
  const Icon = TYPE_ICON[activity.type] || CalendarClock
  const overdue = isOverdue(activity)
  const done = activity.status === 'Completed'
  const lead = leadOf(activity)

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <DateTile value={activity.dueAt} tone={done ? 'done' : overdue ? 'danger' : 'default'} />
        <div className="min-w-0">
          <p className={clsx('truncate text-[15px] font-semibold', done ? 'text-faint line-through' : 'text-ink')}>
            {activity.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
            {showLead && (
              <Link to={`/leads/${leadIdOf(activity)}`} className="font-semibold text-primary hover:underline">
                {lead?.name || 'View lead'}
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Icon className="size-3.5" aria-hidden /> {activity.type}
            </span>
            <span className={clsx('inline-flex items-center gap-1.5', overdue && 'font-semibold text-danger')}>
              <Clock className="size-3.5" aria-hidden /> {formatTime(activity.dueAt)}
            </span>
            {done && activity.completedAt && <span>Done {formatDateTime(activity.completedAt)}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <StatusBadge status={activity.status} overdue={overdue} />
        {!done && onComplete && (
          <Button size="sm" variant="secondary" loading={completing} onClick={() => onComplete(activity)}>
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            Mark complete
          </Button>
        )}
        {done && onReopen && (
          <Button size="sm" variant="secondary" loading={reopening} onClick={() => onReopen(activity)}>
            <RotateCcw className="size-4" aria-hidden />
            Reopen
          </Button>
        )}
      </div>
    </li>
  )
}
