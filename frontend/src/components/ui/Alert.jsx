import { AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export default function Alert({ children, className }) {
  return (
    <div role="alert" className={clsx('tint-danger flex items-start gap-2.5 rounded-[10px] border p-3 text-sm font-medium', className)}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  )
}
