import axios from 'axios'

export const TOKEN_KEY = 'leadflow.token'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach the bearer token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// A 401 on a protected call means the session is gone: clear it and let the app redirect
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || ''
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register')
    if (error.response?.status === 401 && !isAuthCall) onUnauthorized()
    return Promise.reject(error)
  },
)

/**
 * Normalise any failure into { message, fieldErrors, status }.
 * API errors look like { success:false, message, errors:[{ field|path|param, message|msg }] }.
 */
export function parseApiError(error) {
  if (!error.response) {
    const timedOut = error.code === 'ECONNABORTED'
    return {
      status: 0,
      message: timedOut
        ? 'The server took too long to respond. Please try again.'
        : 'Cannot reach the server. Check your connection and that the API is running.',
      fieldErrors: {},
    }
  }
  const { status, data } = error.response
  const fieldErrors = {}
  if (Array.isArray(data?.errors)) {
    for (const e of data.errors) {
      const field = e.field || e.path || e.param
      if (field && !fieldErrors[field]) fieldErrors[field] = e.message || e.msg || 'Invalid value'
    }
  }
  return {
    status,
    message: data?.message || (status >= 500 ? 'Something went wrong on our side.' : 'Request failed.'),
    fieldErrors,
  }
}

// Unwrap { success, message, data } -> data
const unwrap = (res) => res.data?.data

export const authApi = {
  register: (body) => api.post('/auth/register', body).then(unwrap),
  login: (body) => api.post('/auth/login', body).then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
}

export const leadsApi = {
  list: (params) => api.get('/leads', { params }).then(unwrap),
  exportCsv: (params) => api.get('/leads', { params: { ...params, format: 'csv' }, responseType: 'blob' }).then((r) => r.data),
  get: (id) => api.get(`/leads/${id}`).then(unwrap),
  create: (body) => api.post('/leads', body).then(unwrap),
  update: (id, body) => api.patch(`/leads/${id}`, body).then(unwrap),
  remove: (id) => api.delete(`/leads/${id}`).then(unwrap),
}

export const analyticsApi = {
  get: () => api.get('/dashboard/analytics').then(unwrap),
}

export const activitiesApi = {
  list: (params) => api.get('/activities', { params }).then(unwrap),
  create: (body) => api.post('/activities', body).then(unwrap),
  update: (id, body) => api.patch(`/activities/${id}`, body).then(unwrap),
}

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then(unwrap),
}

export default api
