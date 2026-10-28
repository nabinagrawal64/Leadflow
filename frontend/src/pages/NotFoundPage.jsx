import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl font-semibold text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
      <p className="mt-1.5 text-sm text-ink-soft">The page you are looking for does not exist or was moved.</p>
      <Link to="/dashboard" className="mt-6"><Button>Back to dashboard</Button></Link>
    </main>
  )
}
