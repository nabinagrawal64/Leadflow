import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { parseApiError } from '../lib/api'
import { STAGES, STAGE_COLOR, STAGE_ON_COLOR } from '../lib/constants'
import { EMAIL_RE } from '../lib/format'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { Input } from '../components/ui/Field'
import Logo from '../components/layout/Logo'
import ThemeToggle from '../components/layout/ThemeToggle'

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

/** Decorative: a lead stepping down the pipeline. Builds once on load. */
function PipelineArt() {
  return (
    <div className="space-y-2.5" aria-hidden>
      {STAGES.map((stage, i) => (
        <div
          key={stage}
          className="chev-slot chev-build !flex-none"
          style={{ marginLeft: i * 34, width: 'min(78%, 420px)', animationDelay: `${180 + i * 130}ms` }}
        >
          <span
            className="chev !justify-start text-[15px] font-bold"
            data-pos="mid"
            style={{ background: STAGE_COLOR[stage], color: STAGE_ON_COLOR[stage], height: 52, paddingLeft: 30 }}
          >
            {stage}
          </span>
        </div>
      ))}
    </div>
  )
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
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Artwork panel */}
      <aside
        className="relative hidden overflow-hidden bg-panel-art p-14 text-white lg:flex lg:flex-col lg:justify-between"
        style={{ backgroundImage: 'radial-gradient(70% 55% at 0% 0%, rgba(47,55,242,0.38), transparent 70%)' }}
      >
        <Logo onDark />
        <div>
          <h2 className="max-w-md text-[56px] font-bold leading-[1.02]">From first hello to signed deal.</h2>
          <p className="mt-5 max-w-sm text-base text-white/70">
            Track every enquiry through your pipeline and always know who to call next.
          </p>
          <div className="mt-14">
            <PipelineArt />
          </div>
        </div>
        <p className="text-sm text-white/45">VyorAI SDE intern evaluation project</p>
      </aside>

      {/* Form panel */}
      <main className="relative flex items-center justify-center px-5 py-16 sm:px-10">
        <div className="absolute inset-x-5 top-5 flex items-center justify-between sm:inset-x-8 lg:justify-end">
          <span className="lg:hidden"><Logo /></span>
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-[34px] font-bold leading-tight text-ink">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            {isRegister ? 'Set up in a minute and add your first lead.' : 'Log in to pick up where your pipeline left off.'}
          </p>

          {formError && <Alert className="mt-6">{formError}</Alert>}

          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
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
                className="absolute right-2 top-[31px] rounded-lg p-2 text-faint transition-colors hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {isRegister && (
              <Input label="Confirm password" required type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={values.confirm} onChange={set('confirm')} error={errors.confirm} placeholder="••••••••" />
            )}

            <Button type="submit" loading={submitting} className="mt-2 w-full">
              {isRegister ? 'Create account' : 'Log in'}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-muted">
            {isRegister ? 'Already have an account?' : 'New to LeadFlow?'}{' '}
            <Link to={isRegister ? '/login' : '/register'} className="font-bold text-primary hover:underline">
              {isRegister ? 'Log in' : 'Create one'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
