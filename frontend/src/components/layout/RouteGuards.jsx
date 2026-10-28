import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../ui/States'

// Protected area: redirects to /login (remembering where the user was heading)
export function ProtectedRoute() {
  const { isAuthenticated, booting } = useAuth()
  const location = useLocation()

  if (booting) return <Spinner label="Restoring your session…" className="min-h-screen" />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

// Login/Register: signed-in users go straight to the app
export function PublicOnlyRoute() {
  const { isAuthenticated, booting } = useAuth()
  if (booting) return <Spinner label="Restoring your session…" className="min-h-screen" />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
