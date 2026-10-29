import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-55',
  secondary: 'bg-surface text-ink ring-1 ring-inset ring-line hover:bg-sunk disabled:opacity-55',
  danger: 'bg-danger text-on-danger hover:brightness-110 disabled:opacity-55',
  ghost: 'text-muted hover:bg-sunk hover:text-ink disabled:opacity-40',
}

const sizes = {
  sm: 'h-9 gap-1.5 px-3.5 text-[13px]',
  md: 'h-11 gap-2 px-5 text-sm',
  icon: 'size-10 justify-center',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-[10px] font-semibold transition-colors duration-150',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
