import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { LogoMark } from '../components/layout/Logo'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <LogoMark className="h-8 w-[46px]" />
      <h1 className="mt-6 text-[44px] font-bold leading-tight">This page isn't in the pipeline</h1>
      <p className="mt-2 max-w-sm text-[15px] text-muted">The link may be broken or the page may have moved.</p>
      <Link to="/dashboard" className="mt-7"><Button>Go to dashboard</Button></Link>
    </main>
  )
}
