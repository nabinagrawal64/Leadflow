import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import clsx from 'clsx'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    (type, message) => {
      const id = ++idRef.current
      setToasts((t) => [...t, { id, type, message }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:inset-x-auto md:right-6 md:items-end"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={clsx(
              'pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-3 overflow-hidden rounded-2xl border border-line border-l-4 bg-surface p-3.5 text-sm shadow-[0_12px_32px_-8px_rgba(8,10,40,0.35)]',
              t.type === 'error' ? 'border-l-danger' : 'border-l-success',
            )}
          >
            {t.type === 'error' ? (
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
            ) : (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            )}
            <p className="flex-1 font-medium text-ink">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded p-0.5 text-faint transition-colors hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
