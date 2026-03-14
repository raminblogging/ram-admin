// ═══════════════════════════════════════════════════════
//  RAM.OS — API & Core Utilities
//  File: src/lib/api.js
// ═══════════════════════════════════════════════════════

// ── CLOUDFLARE WORKER API ENDPOINT ──────────────────────
// Same worker from original project, just consumed via React
export const DEFAULT_API = 'https://ramsrinivasan-api.rammv2001.workers.dev'

export function getApiBase() {
  return (localStorage.getItem('ramos_api') || DEFAULT_API).replace(/\/$/, '')
}

export function getToken() {
  return localStorage.getItem('ramos_token') || ''
}

export function setToken(token) {
  localStorage.setItem('ramos_token', token)
}

export function clearToken() {
  localStorage.removeItem('ramos_token')
}

export function isAuthenticated() {
  return !!getToken()
}

// ── MAIN API FETCH WRAPPER ──────────────────────────────
export async function api(path, opts = {}) {
  const base = getApiBase()
  const res = await fetch(base + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getToken(),
      ...(opts.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    let message = text
    try { message = JSON.parse(text).error || text } catch {}
    throw new Error(message || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── SHORTHAND METHODS ─────────────────────────────────
export const apiGet    = (path)        => api(path, { method: 'GET' })
export const apiPost   = (path, body)  => api(path, { method: 'POST',   body: JSON.stringify(body) })
export const apiPut    = (path, body)  => api(path, { method: 'PUT',    body: JSON.stringify(body) })
export const apiDelete = (path)        => api(path, { method: 'DELETE' })

// ═══════════════════════════════════════════════════════
//  API ENDPOINT HELPERS
// ═══════════════════════════════════════════════════════

// Auth
export const login = (email, password) => apiPost('/api/auth/login', { email, password })

// Personal data (tasks, notes, events, categories)
export const fetchItems   = (table)          => apiGet(`/api/personal/${table}`)
export const createItem   = (table, data)    => apiPost(`/api/personal/${table}`, data)
export const updateItem   = (table, id, data)=> apiPut(`/api/personal/${table}/${id}`, data)
export const deleteItem   = (table, id)      => apiDelete(`/api/personal/${table}/${id}`)

// Blogs (admin)
export const fetchBlogs      = ()          => apiGet('/api/admin/blogs')
export const createBlog      = (data)      => apiPost('/api/admin/blogs', data)
export const updateBlog      = (id, data)  => apiPut(`/api/admin/blogs/${id}`, data)
export const deleteBlog      = (id)        => apiDelete(`/api/admin/blogs/${id}`)
export const reorderBlogs    = (order)     => apiPut('/api/admin/blogs/reorder', { order })

// Public blogs
export const fetchPublicBlogs = ()         => apiGet('/api/blogs')
export const fetchPublicBlog  = (slug)     => apiGet(`/api/blogs/${slug}`)

// Messages
export const fetchMessages         = ()    => apiGet('/api/admin/messages')
export const markMessageRead       = (id)  => apiPut(`/api/admin/messages/${id}/read`, {})
export const markAllMessagesRead   = ()    => apiPut('/api/admin/messages/read-all', {})
export const deleteMessage         = (id)  => apiDelete(`/api/admin/messages/${id}`)

// Subscriptions
export const fetchSubscriptions    = ()    => apiGet('/api/admin/subscriptions')
export const markSubRead           = (id)  => apiPut(`/api/admin/subscriptions/${id}/read`, {})
export const markAllSubsRead       = ()    => apiPut('/api/admin/subscriptions/read-all', {})
export const deleteSubscription    = (id)  => apiDelete(`/api/admin/subscriptions/${id}`)

// Public contact/subscribe
export const submitContact   = (data) => apiPost('/api/contact', data)
export const submitSubscribe = (data) => apiPost('/api/subscribe', data)

// AI Optimize (Gemini via worker)
export const aiOptimize = (data) => apiPost('/api/admin/ai/optimize', data)

// ═══════════════════════════════════════════════════════
//  DATE / TIME HELPERS
// ═══════════════════════════════════════════════════════

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

export function weekDays() {
  const days = []
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  for (let i = 0; i < 7; i++) {
    days.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() + 1)
  }
  return days
}

// ═══════════════════════════════════════════════════════
//  LOCAL STORAGE HELPERS
// ═══════════════════════════════════════════════════════

export function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem('ramos_' + key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export function lsSet(key, value) {
  try { localStorage.setItem('ramos_' + key, JSON.stringify(value)) } catch {}
}

export function lsDel(key) {
  localStorage.removeItem('ramos_' + key)
}

// ═══════════════════════════════════════════════════════
//  MISC HELPERS
// ═══════════════════════════════════════════════════════

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Clamp a number between min and max
export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

// Deep clone (simple)
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Sort helpers
export function sortByDate(arr, field = 'createdAt', desc = true) {
  return [...arr].sort((a, b) => {
    const ta = new Date(a[field] || 0).getTime()
    const tb = new Date(b[field] || 0).getTime()
    return desc ? tb - ta : ta - tb
  })
}
