import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // move focus into the dialog
    const first = panelRef.current?.querySelector('input, select, textarea, button:not([data-close])')
    first?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-[#080a1a]/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          'relative flex max-h-[92vh] w-full animate-pop flex-col rounded-t-3xl border border-line bg-surface shadow-[0_24px_60px_-12px_rgba(8,10,40,0.45)] sm:rounded-3xl',
          size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-lg',
        )}
      >
        <header className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div>
            <h2 className="text-xl font-bold text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            data-close
            onClick={onClose}
            className="-mr-2 -mt-1 rounded-[10px] p-2 text-faint transition-colors hover:bg-sunk hover:text-ink"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 px-6 pb-6 pt-2">{footer}</footer>}
      </div>
    </div>
  )
}
