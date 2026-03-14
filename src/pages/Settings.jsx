// ═══════════════════════════════════════════════════════
//  RAM.OS — Settings Page (Enhanced with AI Keys)
//  File: src/pages/Settings.jsx
// ═══════════════════════════════════════════════════════

import { useState } from 'react'
import { useApp } from '../lib/context'
import { lsGet, lsSet, getApiBase, DEFAULT_API } from '../lib/api'
import { PageHeader } from '../components/UI'

const THEMES = [
  { id: 'wine',     label: 'Wine Dark',  dot: '#8b1a3a', bg: '#0a090f' },
  { id: 'midnight', label: 'Midnight',   dot: '#5a5a6e', bg: '#050505' },
  { id: 'forge',    label: 'Forge',      dot: '#8b4513', bg: '#0e0b09' },
  { id: 'obsidian', label: 'Obsidian',   dot: '#4a1878', bg: '#07060e' },
  { id: 'jade',     label: 'Jade',       dot: '#0d6e4a', bg: '#060e0b' },
  { id: 'slate',    label: 'Slate',      dot: '#2563eb', bg: '#0a0e14' },
]

export default function Settings() {
  const { theme, setTheme, logout } = useApp()
  const [apiUrl, setApiUrl] = useState(getApiBase())
  const [saved, setSaved] = useState(false)
  const [showKeys, setShowKeys] = useState({})
  const [aiKeys, setAiKeys] = useState({
    claude: localStorage.getItem('ramos_claude_key') || '',
    groq:   localStorage.getItem('ramos_groq_key') || '',
    gemini: localStorage.getItem('ramos_gemini_key') || '',
  })
  const [aiKeysSaved, setAiKeysSaved] = useState(false)

  function saveApi() {
    localStorage.setItem('ramos_api', apiUrl || DEFAULT_API)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  function resetApi() {
    setApiUrl(DEFAULT_API)
    localStorage.setItem('ramos_api', DEFAULT_API)
  }

  function saveAiKeys() {
    localStorage.setItem('ramos_claude_key', aiKeys.claude)
    localStorage.setItem('ramos_groq_key',   aiKeys.groq)
    localStorage.setItem('ramos_gemini_key', aiKeys.gemini)
    setAiKeysSaved(true); setTimeout(() => setAiKeysSaved(false), 2000)
  }

  const AI_PROVIDERS = [
    { id: 'claude', label: 'Claude (Anthropic)', icon: '🧠', color: '#d97706', note: 'optional — uses built-in proxy if blank', link: 'console.anthropic.com' },
    { id: 'groq',   label: 'Groq',              icon: '⚡', color: '#16a34a', note: 'required for Groq models', link: 'console.groq.com' },
    { id: 'gemini', label: 'Gemini (Google)',    icon: '✨', color: '#2563eb', note: 'required for Gemini models', link: 'aistudio.google.com' },
  ]

  const appVersion = '4.1.0'

  return (
    <div>
      <PageHeader title="Settings" />

      {/* Theme */}
      <div className="settings-section">
        <div className="settings-section-title">Appearance</div>
        <div className="theme-grid">
          {THEMES.map(t => (
            <div key={t.id} className={`theme-swatch ${theme === t.id ? 'active' : ''}`} onClick={() => setTheme(t.id)}>
              <div className="theme-dot" style={{ background: `linear-gradient(135deg, ${t.bg} 50%, ${t.dot} 50%)` }} />
              <div className="theme-name">{t.label}</div>
              {theme === t.id && <div style={{ fontSize: 11, color: 'var(--acc3)', marginTop: 2 }}>✓ Active</div>}
            </div>
          ))}
        </div>
      </div>

      {/* AI API Keys */}
      <div className="settings-section">
        <div className="settings-section-title">AI Provider Keys</div>
        <div className="card">
          <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 14, lineHeight: 1.6 }}>
            Configure API keys to use different AI providers in the Ramai AI chat. Keys are stored locally in your browser.
          </div>

          {AI_PROVIDERS.map(p => (
            <div key={p.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{p.note}</div>
                  </div>
                </div>
                {aiKeys[p.id] && (
                  <span style={{ fontSize: 11, color: '#16a34a', background: '#16a34a22', padding: '2px 8px', borderRadius: 6 }}>✓ Set</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="inp"
                  type={showKeys[p.id] ? 'text' : 'password'}
                  placeholder={`${p.label} API key…`}
                  value={aiKeys[p.id]}
                  onChange={e => setAiKeys(k => ({ ...k, [p.id]: e.target.value }))}
                  style={{ fontSize: 13, fontFamily: 'monospace', flex: 1 }}
                />
                <button className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => setShowKeys(s => ({ ...s, [p.id]: !s[p.id] }))}>
                  {showKeys[p.id] ? '🙈' : '👁'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>
                Get key at: <code style={{ color: 'var(--acc3)' }}>{p.link}</code>
              </div>
            </div>
          ))}

          <button className="btn btn-primary btn-sm" onClick={saveAiKeys} style={{ marginTop: 4 }}>
            {aiKeysSaved ? '✓ Saved!' : '💾 Save AI Keys'}
          </button>
        </div>
      </div>

      {/* API Config */}
      <div className="settings-section">
        <div className="settings-section-title">API Configuration</div>
        <div className="card">
          <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 10, lineHeight: 1.6 }}>
            Your Cloudflare Worker endpoint. Change this if you've deployed your own worker.
          </div>
          <input className="inp" value={apiUrl} onChange={e => setApiUrl(e.target.value)}
            placeholder="https://your-worker.workers.dev" style={{ marginBottom: 10, fontFamily: 'monospace', fontSize: 13 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={saveApi}>{saved ? '✓ Saved!' : 'Save'}</button>
            <button className="btn btn-ghost btn-sm" onClick={resetApi}>Reset Default</button>
          </div>
        </div>
      </div>

      {/* Worker & DB Info */}
      <div className="settings-section">
        <div className="settings-section-title">Backend Info</div>
        <div className="card">
          <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.8 }}>
            <div>🔧 <strong style={{ color: 'var(--txt)' }}>Worker:</strong> <code style={{ color: 'var(--acc3)', fontSize: 11 }}>ramsrinivasan-api</code></div>
            <div>🗄️ <strong style={{ color: 'var(--txt)' }}>Database:</strong> <code style={{ color: 'var(--acc3)', fontSize: 11 }}>ramsrinivasan-db</code></div>
            <div>🆔 <strong style={{ color: 'var(--txt)' }}>DB ID:</strong> <code style={{ color: 'var(--txt3)', fontSize: 11 }}>56eabc71-43cd-4850-b4d0-b08eb588f275</code></div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <div className="settings-section-title">About</div>
        <div className="settings-row">
          <div className="settings-row-info"><div className="settings-row-label">Version</div></div>
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--acc3)' }}>v{appVersion}</div>
        </div>
        <div className="settings-row">
          <div className="settings-row-info"><div className="settings-row-label">Stack</div></div>
          <div style={{ fontSize: 12, color: 'var(--txt2)' }}>React + Vite PWA</div>
        </div>
        <div className="settings-row">
          <div className="settings-row-info"><div className="settings-row-label">AI Providers</div></div>
          <div style={{ fontSize: 12, color: 'var(--txt2)' }}>Claude · Groq · Gemini</div>
        </div>
      </div>

      {/* Data */}
      <div className="settings-section">
        <div className="settings-section-title">Data</div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Clear Local Cache</div>
            <div className="settings-row-sub">Removes cached data (won't delete from DB)</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('ramos_') && k !== 'ramos_token' && k !== 'ramos_api' && k !== 'ramos_theme')
            keys.forEach(k => localStorage.removeItem(k))
            window.location.reload()
          }}>Clear</button>
        </div>
      </div>

      {/* Sign out */}
      <div className="settings-section">
        <button className="btn btn-ghost w-full" style={{ height: 48, borderRadius: 12, color: 'var(--acc3)' }} onClick={logout}>
          → Sign Out
        </button>
      </div>
    </div>
  )
}
