import clsx from 'clsx'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Button from './Button'

export function Spinner({ label = 'Loading…', className }) {
  return (
    <div className={clsx('flex items-center justify-center gap-2 py-16 text-sm text-ink-soft', className)} role="status">
      <Loader2 className="size-5 animate-spin text-brand-600" aria-hidden />
      {label}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={clsx('animate-pulse rounded-lg bg-slate-200/70', className)} aria-hidden />
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="divide-y divide-line" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="hidden h-6 w-24 sm:block" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon className="size-6" aria-hidden />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center" role="alert">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-ink">Something went wrong</h3>
      <p className="mt-1 max-w-md text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
