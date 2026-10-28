import { forwardRef, useId } from 'react'
import clsx from 'clsx'

const control =
  'block w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-slate-400 transition-colors duration-150 ' +
  'focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:bg-slate-50 disabled:text-slate-500'

export function Field({ label, error, hint, required, children, htmlFor, className }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-rose-600" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef(function Input({ label, error, hint, required, className, id, ...props }, ref) {
  const auto = useId()
  const inputId = id || auto
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={inputId} className={className}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={clsx(control, 'h-10', error ? 'border-rose-400' : 'border-line')}
        {...props}
      />
    </Field>
  )
})

export const Select = forwardRef(function Select(
  { label, error, hint, required, className, id, options, placeholder, inputClassName, ...props },
  ref,
) {
  const auto = useId()
  const selectId = id || auto
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={selectId} className={className}>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={Boolean(error)}
        className={clsx(control, 'h-10 pr-8', error ? 'border-rose-400' : 'border-line', inputClassName)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const v = typeof o === 'string' ? { value: o, label: o } : o
          return (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          )
        })}
      </select>
    </Field>
  )
})
