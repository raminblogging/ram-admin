// ═══════════════════════════════════════════════════════
//  RAM.OS — Login Page
//  File: src/pages/Login.jsx
// ═══════════════════════════════════════════════════════

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, setToken } from '../lib/api'
import { useApp } from '../lib/context'

export default function Login() {
  const navigate = useNavigate()
  const { login, showToast } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { showToast('Enter email and password', 'error'); return }
    setLoading(true)
    try {
      const res = await apiLogin(email, password)
      setToken(res.token)
      login(res.token)
      showToast('Welcome back!', 'success')
      navigate('/dashboard')
    } catch (err) {
      showToast(err.message || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--bg2)',
        border: '1px solid var(--bdr)',
        borderRadius: 20,
        padding: 32,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 36,
            color: 'var(--txt)',
            letterSpacing: '-1px',
          }}>
            Ram<span style={{ color: 'var(--acc3)' }}>.</span>OS
          </div>
          <div style={{ fontSize: 13, color: 'var(--txt2)', marginTop: 6 }}>
            Personal Life Operating System
          </div>
        </div>

        {/* Form */}
        <div className="form-group">
          <label className="inp-label">Email</label>
          <input
            type="email"
            className="inp"
            placeholder="admin@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="inp-label">Password</label>
          <input
            type="password"
            className="inp"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="current-password"
          />
        </div>

        <button
          className="btn btn-primary w-full"
          style={{ marginTop: 8, height: 46, fontSize: 15, borderRadius: 12 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '⏳ Signing in…' : 'Sign In →'}
        </button>

        <div style={{
          marginTop: 24,
          padding: '12px 16px',
          background: 'var(--bg3)',
          borderRadius: 10,
          fontSize: 12,
          color: 'var(--txt2)',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--txt3)' }}>Credentials set via Cloudflare:</strong><br />
          Use the email and password you configured with <code style={{ color: 'var(--acc3)' }}>wrangler secret put</code>
        </div>
      </div>
    </div>
  )
}
