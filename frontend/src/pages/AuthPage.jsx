import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, CalendarCheck, Eye, EyeOff, GitBranch, LineChart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { parseApiError } from '../lib/api'
import { EMAIL_RE } from '../lib/format'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import Logo from '../components/layout/Logo'

const HIGHLIGHTS = [
  { icon: GitBranch, title: 'A pipeline you can see', text: 'Move every lead from New to Won in a click.' },
  { icon: CalendarCheck, title: 'Never miss a follow-up', text: 'Schedule calls and meetings, spot what is overdue.' },
  { icon: LineChart, title: 'Numbers you can trust', text: 'Your dashboard is built from your saved records.' },
]

function validate(mode, v) {
  const e = {}
  if (mode === 'register' && !v.name.trim()) e.name = 'Name is required'
  if (!v.email.trim()) e.email = 'Email is required'
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address'
  if (!v.password) e.password = 'Password is required'
  else if (mode === 'register' && v.password.length < 8) e.password = 'Use at least 8 characters'
  if (mode === 'register' && v.confirm !== v.password) e.confirm = 'Passwords do not match'
  return e
}

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    if (errors[field]) setErrors((x) => ({ ...x, [field]: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    const found = validate(mode, values)
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    try {
      const email = values.email.trim().toLowerCase()
      if (isRegister) await register({ name: values.name.trim(), email, password: values.password })
      else await login({ email, password: values.password })
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors((x) => ({ ...x, ...parsed.fieldErrors }))
      setFormError(parsed.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo light />
        <div className="max-w-md">
          <h2 className="text-4xl font-semibold leading-tight">
            Turn enquiries into <span className="text-emerald-400">clients</span>.
          </h2>
          <p className="mt-4 text-slate-300">
            LeadFlow keeps every prospect, stage and follow-up in one place, built for small agencies.
          </p>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-100">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-slate-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-500">VyorAI · SDE Intern Evaluation Project</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-semibold text-ink">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {isRegister ? 'Start tracking leads in under a minute.' : 'Log in to manage your pipeline.'}
          </p>

          {formError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {isRegister && (
              <Input label="Full name" required autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} placeholder="Jane Doe" />
            )}
            <Input label="Email" required type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} placeholder="you@agency.com" />

            <div className="relative">
              <Input
                label="Password"
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={values.password}
                onChange={set('password')}
                error={errors.password}
                hint={isRegister && !errors.password ? 'At least 8 characters' : undefined}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-[30px] rounded p-1.5 text-slate-400 transition-colors hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {isRegister && (
              <Input label="Confirm password" required type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={values.confirm} onChange={set('confirm')} error={errors.confirm} placeholder="••••••••" />
            )}

            <Button type="submit" loading={submitting} className="w-full">
              {isRegister ? 'Create account' : 'Log in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-brand-600 hover:text-brand-700">
              {isRegister ? 'Log in' : 'Create one'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
