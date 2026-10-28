import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, setUnauthorizedHandler, TOKEN_KEY } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // "booting" is true while we verify a stored token with GET /auth/me
  const [booting, setBooting] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
  }, [clearSession])

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    let cancelled = false
    authApi
      .me()
      .then((data) => !cancelled && setUser(data.user ?? data))
      .catch(() => !cancelled && clearSession())
      .finally(() => !cancelled && setBooting(false))
    return () => {
      cancelled = true
    }
  }, [clearSession])

  const startSession = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }, [])

  const login = useCallback(async (credentials) => startSession(await authApi.login(credentials)), [startSession])
  const register = useCallback(async (payload) => startSession(await authApi.register(payload)), [startSession])

  const value = useMemo(
    () => ({ user, booting, isAuthenticated: Boolean(user), login, register, logout: clearSession }),
    [user, booting, login, register, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
