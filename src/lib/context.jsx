// ═══════════════════════════════════════════════════════
//  RAM.OS — App Context
//  File: src/lib/context.jsx
//  Provides: auth state, theme, toast, badges, global data
// ═══════════════════════════════════════════════════════

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { getToken, clearToken, lsGet, lsSet } from './api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // ── AUTH ────────────────────────────────────────────
  const [isAuth, setIsAuth] = useState(() => !!getToken())

  const login = useCallback((token) => {
    setIsAuth(true)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setIsAuth(false)
  }, [])

  // ── THEME ───────────────────────────────────────────
  const [theme, setThemeState] = useState(() => lsGet('theme', 'wine'))

  const setTheme = useCallback((t) => {
    setThemeState(t)
    lsSet('theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // ── TOAST ───────────────────────────────────────────
  const [toast, setToastState] = useState({ msg: '', type: 'info', visible: false })
  const toastTimer = useRef(null)

  const showToast = useCallback((msg, type = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastState({ msg, type, visible: true })
    toastTimer.current = setTimeout(() => {
      setToastState(s => ({ ...s, visible: false }))
    }, 3000)
  }, [])

  // ── BADGES (unread counts) ──────────────────────────
  const [badges, setBadges] = useState({ messages: 0, subscriptions: 0, tasks: 0, ideas: 0 })

  const updateBadge = useCallback((key, count) => {
    setBadges(b => ({ ...b, [key]: count }))
  }, [])

  // ── CURRENT PAGE (for back button / header) ─────────
  const [currentPage, setCurrentPage] = useState('dashboard')

  // ── GLOBAL SEARCH DATA ──────────────────────────────
  const [searchIndex, setSearchIndex] = useState([])

  const addToSearchIndex = useCallback((items) => {
    setSearchIndex(prev => {
      const newEntries = items.filter(n => !prev.find(p => p.id === n.id))
      return [...prev, ...newEntries]
    })
  }, [])

  return (
    <AppContext.Provider value={{
      isAuth, login, logout,
      theme, setTheme,
      toast, showToast,
      badges, updateBadge,
      currentPage, setCurrentPage,
      searchIndex, addToSearchIndex,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
