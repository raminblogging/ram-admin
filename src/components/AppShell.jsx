// ═══════════════════════════════════════════════════════
//  RAM.OS — App Shell
//  File: src/components/AppShell.jsx
//  Handles: layout, navigation, search, routing
// ═══════════════════════════════════════════════════════

import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../lib/context'
import { Toast } from './UI'

// ── NAV ITEMS for bottom bar & sidebar ─────────────────
const BOTTOM_NAV = [
  { path: '/dashboard', icon: '🏠', label: 'Home' },
  { path: '/tasks',     icon: '✅', label: 'Tasks' },
  { path: '/apps',      icon: '⊞',  label: 'Apps' },
  { path: '/notes',     icon: '📓', label: 'Notes' },
  { path: '/settings',  icon: '⚙️',  label: 'Settings' },
]

const SIDEBAR_NAV = [
  { section: 'Main' },
  { path: '/dashboard',     icon: '🏠', label: 'Dashboard' },
  { path: '/apps',          icon: '⊞',  label: 'All Apps' },
  { section: 'Connect' },
  { path: '/messages',      icon: '✉️',  label: 'Messages',      badge: 'messages' },
  { path: '/subscriptions', icon: '📬', label: 'Subscriptions',  badge: 'subscriptions' },
  { path: '/blog',          icon: '📝', label: 'Blog' },
  { section: 'Productivity' },
  { path: '/tasks',         icon: '✅', label: 'Tasks',          badge: 'tasks' },
  { path: '/calendar',      icon: '📅', label: 'Calendar' },
  { path: '/notes',         icon: '📓', label: 'Notes' },
  { path: '/categories',    icon: '🏷️',  label: 'Categories' },
  { path: '/productivity',  icon: '⚡', label: 'Work Tools' },
  { section: 'Lifestyle' },
  { path: '/gym',           icon: '🏋️',  label: 'Gym' },
  { path: '/habits',        icon: '🔥', label: 'Habits' },
  { path: '/ideas',         icon: '💡', label: 'Ideas',          badge: 'ideas' },
  { path: '/learning',      icon: '🧠', label: 'Learning' },
  { path: '/tracker',       icon: '⚽', label: 'Tracker' },
  { path: '/drawing',       icon: '✏️',  label: 'Drawing' },
  { section: 'System' },
  { path: '/ai',            icon: '🤖', label: 'Ramai AI' },
  { path: '/settings',      icon: '⚙️',  label: 'Settings' },
]

export default function AppShell({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { badges, logout, searchIndex } = useApp()

  // ── SEARCH ────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)

  const handleSearch = useCallback((q) => {
    setSearch(q)
    if (!q.trim()) { setSearchResults([]); setShowSearch(false); return }
    const lower = q.toLowerCase()
    const results = searchIndex
      .filter(item =>
        (item.title || '').toLowerCase().includes(lower) ||
        (item.content || '').toLowerCase().includes(lower)
      )
      .slice(0, 8)
    setSearchResults(results)
    setShowSearch(true)
  }, [searchIndex])

  const goTo = (path) => {
    navigate(path)
    setSearch('')
    setSearchResults([])
    setShowSearch(false)
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="app-shell">
      {/* ── SIDEBAR (desktop) ──────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">Ram<span>.</span>OS</div>
        {SIDEBAR_NAV.map((item, i) => {
          if (item.section) return <div className="sidebar-section" key={i}>{item.section}</div>
          const count = item.badge ? badges[item.badge] : 0
          return (
            <div
              key={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => goTo(item.path)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {item.label}
              {count > 0 && <span className="sidebar-badge">{count}</span>}
            </div>
          )
        })}
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <div className="sidebar-nav-item" onClick={logout}>
            <span className="sidebar-nav-icon">→</span>
            Sign Out
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────── */}
      <div className="main-area">
        {/* ── TOPBAR ──────────────────────────────── */}
        <header className="topbar">
          <div className="topbar-logo">Ram<span>.</span>OS</div>
          <div className="topbar-search">
            <span className="topbar-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              onFocus={() => search && setShowSearch(true)}
            />
            {showSearch && searchResults.length > 0 && (
              <div className="search-dropdown">
                {searchResults.map(r => (
                  <div
                    key={r.id}
                    className="search-result-item"
                    onClick={() => goTo(r.path || '/dashboard')}
                  >
                    <span>{r.icon || '📄'}</span>
                    <span style={{ flex: 1 }}>{r.title}</span>
                    <span className="search-result-type">{r.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="topbar-actions">
            <button
              className="btn btn-ghost btn-sm"
              title="Sign out"
              onClick={() => { if (window.confirm('Sign out of RAM.OS?')) logout() }}
              style={{ fontSize: 11, color: 'var(--txt3)', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid var(--bdr)', borderRadius: 8 }}
            >
              <span style={{ fontSize: 14 }}>⎋</span> Sign out
            </button>
          </div>
        </header>

        {/* ── PAGE CONTENT ────────────────────────── */}
        <main className="page-content">
          {children}
        </main>

        {/* ── BOTTOM NAV (mobile) ──────────────────── */}
        <nav className="bottom-nav">
          {BOTTOM_NAV.map(item => {
            const count = item.badge ? badges[item.badge] : 0
            return (
              <div
                key={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => goTo(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {count > 0 && <span className="nav-badge">{count}</span>}
              </div>
            )
          })}
        </nav>
      </div>

      {/* ── TOAST ───────────────────────────────── */}
      <Toast />
    </div>
  )
}
