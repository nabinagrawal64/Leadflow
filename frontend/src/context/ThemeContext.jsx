import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
const KEY = 'leadflow.theme'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* storage can be unavailable (private mode); the theme still applies for this visit */
    }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
