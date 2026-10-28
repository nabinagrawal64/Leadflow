import { useCallback, useEffect, useRef, useState } from 'react'
import { parseApiError } from './api'

/**
 * Run an async loader on mount (and whenever `deps` change) and expose
 * { data, loading, error, reload }.
 * - Stale responses are ignored, so fast typing in a search box never shows
 *   out-of-order results.
 * - Existing data is kept while reloading, so lists don't flash empty.
 */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const callId = useRef(0)

  const run = useCallback(() => {
    const id = ++callId.current
    setState((s) => ({ ...s, loading: true, error: null }))
    loader()
      .then((data) => id === callId.current && setState({ data, loading: false, error: null }))
      .catch(
        (err) =>
          id === callId.current && setState({ data: null, loading: false, error: parseApiError(err).message }),
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
    return () => {
      callId.current++
    }
  }, [run])

  return { ...state, reload: run }
}

export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
