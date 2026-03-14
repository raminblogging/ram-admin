// ═══════════════════════════════════════════════════════
//  RAM.OS — All Apps Page
//  File: src/pages/Apps.jsx
// ═══════════════════════════════════════════════════════

import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/context'

const APP_SECTIONS = [
  {
    title: 'Connect',
    apps: [
      { icon: '✉️',  label: 'Messages',      path: '/messages',      bubble: 'bubble-violet', badge: 'messages' },
      { icon: '📬', label: 'Subscriptions',  path: '/subscriptions', bubble: 'bubble-teal',   badge: 'subscriptions' },
      { icon: '📝', label: 'Blog',           path: '/blog',          bubble: 'bubble-blue' },
    ],
  },
  {
    title: 'Productivity',
    apps: [
      { icon: '✅', label: 'Tasks',      path: '/tasks',        bubble: 'bubble-green', badge: 'tasks' },
      { icon: '📅', label: 'Calendar',   path: '/calendar',     bubble: 'bubble-blue' },
      { icon: '📓', label: 'Notes',      path: '/notes',        bubble: 'bubble-amber' },
      { icon: '🏷️',  label: 'Categories', path: '/categories',   bubble: 'bubble-pink' },
      { icon: '⚡', label: 'Work Tools', path: '/productivity', bubble: 'bubble-cyan' },
    ],
  },
  {
    title: 'Lifestyle',
    apps: [
      { icon: '🏋️',  label: 'Gym',       path: '/gym',       bubble: 'bubble-orange' },
      { icon: '🔥', label: 'Habits',    path: '/habits',    bubble: 'bubble-lime' },
      { icon: '💡', label: 'Ideas',     path: '/ideas',     bubble: 'bubble-amber', badge: 'ideas' },
      { icon: '🧠', label: 'Learning',  path: '/learning',  bubble: 'bubble-indigo' },
      { icon: '⚽', label: 'Tracker',   path: '/tracker',   bubble: 'bubble-purple' },
      { icon: '✏️',  label: 'Drawing',   path: '/drawing',   bubble: 'bubble-rose' },
    ],
  },
  {
    title: 'System',
    apps: [
      { icon: '🤖', label: 'Ramai AI', path: '/ai',       bubble: 'bubble-ai' },
      { icon: '⚙️',  label: 'Settings', path: '/settings', bubble: 'bubble-dark' },
    ],
  },
]

export default function Apps() {
  const navigate = useNavigate()
  const { badges, logout } = useApp()

  return (
    <div>
      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 4 }}>All Features</div>
      <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 24 }}>Your personal OS modules</div>

      {APP_SECTIONS.map(section => (
        <div key={section.title}>
          <div className="apps-section-title">{section.title}</div>
          <div className="apps-grid" style={{ marginBottom: 8 }}>
            {section.apps.map(app => {
              const count = app.badge ? badges[app.badge] : 0
              return (
                <div key={app.path} className="app-icon" onClick={() => navigate(app.path)}>
                  <div className={`app-bubble ${app.bubble}`}>{app.icon}</div>
                  <div className="app-label">{app.label}</div>
                  {count > 0 && <div className="app-badge">{count}</div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <div className="apps-section-title">Account</div>
      <div className="apps-grid">
        <div className="app-icon" onClick={logout}>
          <div className="app-bubble bubble-dark">→</div>
          <div className="app-label">Sign Out</div>
        </div>
      </div>
    </div>
  )
}
