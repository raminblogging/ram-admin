// ═══════════════════════════════════════════════════════
//  RAM.OS — Dashboard Page
//  File: src/pages/Dashboard.jsx
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchItems, formatDate, lsGet, lsSet, relativeTime } from '../lib/api'
import { useApp } from '../lib/context'
import { Spinner } from '../components/UI'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function Dashboard() {
  const navigate = useNavigate()
  const { showToast, updateBadge, addToSearchIndex } = useApp()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [t, n, e] = await Promise.all([
        fetchItems('tasks'),
        fetchItems('notes'),
        fetchItems('events'),
      ])
      setTasks(t)
      setNotes(n)
      setEvents(e)
      // Update badges
      const openTasks = t.filter(x => !x.done).length
      updateBadge('tasks', openTasks)
      // Add to search index
      addToSearchIndex([
        ...t.map(x => ({ id: x.id, title: x.title, type: 'Task', icon: '✅', path: '/tasks' })),
        ...n.map(x => ({ id: x.id, title: x.title, content: x.content, type: 'Note', icon: '📓', path: '/notes' })),
      ])
      // Cache locally for offline
      lsSet('tasks', t)
      lsSet('notes', n)
      lsSet('events', e)
    } catch {
      // Fall back to local cache
      setTasks(lsGet('tasks', []))
      setNotes(lsGet('notes', []))
      setEvents(lsGet('events', []))
    } finally {
      setLoading(false)
    }
  }

  const today = todayStr()
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const dateLabel = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const openTasks = tasks.filter(t => !t.done)
  const todayEvents = events.filter(e => e.date === today)
  const recentNotes = notes.slice(0, 4)
  const upcomingTasks = openTasks.slice(0, 5)

  const quickApps = [
    { icon: '✅', label: 'Tasks',    path: '/tasks',    bubble: 'bubble-green' },
    { icon: '📓', label: 'Notes',    path: '/notes',    bubble: 'bubble-amber' },
    { icon: '📅', label: 'Calendar', path: '/calendar', bubble: 'bubble-blue' },
    { icon: '💡', label: 'Ideas',    path: '/ideas',    bubble: 'bubble-amber' },
    { icon: '🔥', label: 'Habits',   path: '/habits',   bubble: 'bubble-lime' },
    { icon: '🤖', label: 'AI',       path: '/ai',       bubble: 'bubble-ai' },
    { icon: '📝', label: 'Blog',     path: '/blog',     bubble: 'bubble-blue' },
    { icon: '⊞',  label: 'All Apps', path: '/apps',     bubble: 'bubble-dark' },
  ]

  if (loading) return <Spinner />

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--txt)' }}>
          {greeting} 👋
        </div>
        <div style={{ fontSize: 13, color: 'var(--txt2)', marginTop: 4 }}>{dateLabel}</div>
      </div>

      {/* Stats */}
      <div className="dash-stats-grid" style={{ marginBottom: 24 }}>
        <div className="dash-stat">
          <span className="dash-stat-icon">✅</span>
          <div className="dash-stat-info">
            <div className="dash-stat-value">{openTasks.length}</div>
            <div className="dash-stat-label">Open Tasks</div>
          </div>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-icon">📅</span>
          <div className="dash-stat-info">
            <div className="dash-stat-value">{todayEvents.length}</div>
            <div className="dash-stat-label">Today's Events</div>
          </div>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-icon">📓</span>
          <div className="dash-stat-info">
            <div className="dash-stat-value">{notes.length}</div>
            <div className="dash-stat-label">Notes</div>
          </div>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-icon">✔️</span>
          <div className="dash-stat-info">
            <div className="dash-stat-value">{tasks.filter(t => t.done).length}</div>
            <div className="dash-stat-label">Done Today</div>
          </div>
        </div>
      </div>

      {/* Quick Apps */}
      <div className="section-label" style={{ marginBottom: 12 }}>Quick Access</div>
      <div className="apps-grid" style={{ marginBottom: 28 }}>
        {quickApps.map(a => (
          <div key={a.path} className="app-icon" onClick={() => navigate(a.path)}>
            <div className={`app-bubble ${a.bubble}`}>{a.icon}</div>
            <div className="app-label">{a.label}</div>
          </div>
        ))}
      </div>

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Today's Events</div>
          {todayEvents.map(ev => (
            <div key={ev.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>📅</span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--txt)' }}>{ev.title}</div>
                {ev.time && <div style={{ fontSize: 12, color: 'var(--txt2)' }}>⏰ {ev.time}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Upcoming Tasks</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>See all →</button>
          </div>
          {upcomingTasks.map(t => (
            <div key={t.id} className="item-row" style={{ marginBottom: 6 }}>
              <div className={`item-check ${t.done ? 'checked' : ''}`}>
                {t.done ? '✓' : ''}
              </div>
              <div className="item-body">
                <div className="item-title">{t.title}</div>
                {t.dueDate && (
                  <div className="item-meta">
                    <span>📅 {formatDate(t.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Recent Notes</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notes')}>See all →</button>
          </div>
          <div className="notes-grid">
            {recentNotes.map(n => (
              <div key={n.id} className="note-card" onClick={() => navigate('/notes')}>
                <div className="note-title">{n.title || 'Untitled'}</div>
                <div className="note-preview">{n.content}</div>
                <div className="note-time">{relativeTime(n.updatedAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && notes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--txt2)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Welcome to Ram.OS!</div>
          <div style={{ fontSize: 13 }}>Start by adding tasks, notes, or exploring the apps.</div>
        </div>
      )}
    </div>
  )
}
