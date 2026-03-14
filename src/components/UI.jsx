// ═══════════════════════════════════════════════════════
//  RAM.OS — Shared UI Components
//  File: src/components/UI.jsx
// ═══════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'
import { useApp } from '../lib/context'

// ── TOAST ────────────────────────────────────────────
export function Toast() {
  const { toast } = useApp()
  return (
    <div className={`toast ${toast.type} ${toast.visible ? 'visible' : ''}`}>
      {toast.msg}
    </div>
  )
}

// ── MODAL SHEET ───────────────────────────────────────
export function Modal({ open, onClose, title, children, actions }) {
  const overlayRef = useRef(null)

  // Close on backdrop click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        {title && <div className="modal-title">{title}</div>}
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  )
}

// ── CONFIRM DELETE DIALOG ─────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, message = 'Delete this item?' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirm"
      actions={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ background: '#8b1a3a' }} onClick={() => { onConfirm(); onClose() }}>
            Delete
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--txt2)', fontSize: 14 }}>{message}</p>
    </Modal>
  )
}

// ── LOADING SPINNER ───────────────────────────────────
export function Spinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
    </div>
  )
}

// ── EMPTY STATE ───────────────────────────────────────
export function EmptyState({ icon = '📭', title = 'Nothing here yet', sub = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {action}
    </div>
  )
}

// ── PAGE HEADER ───────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <div className="page-title">{title}</div>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  )
}

// ── STATS ROW ─────────────────────────────────────────
export function StatsRow({ stats }) {
  return (
    <div className="stats-row">
      {stats.map(s => (
        <div className="stat-card" key={s.label}>
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── FILTER PILLS ──────────────────────────────────────
export function FilterPills({ options, value, onChange }) {
  return (
    <div className="pills">
      {options.map(o => (
        <button
          key={o.value}
          className={`pill ${value === o.value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── FORM GROUP ────────────────────────────────────────
export function FormGroup({ label, children }) {
  return (
    <div className="form-group">
      {label && <label className="inp-label">{label}</label>}
      {children}
    </div>
  )
}

// ── BADGE ─────────────────────────────────────────────
export function Badge({ children, color = 'gray' }) {
  return <span className={`badge badge-${color}`}>{children}</span>
}

// ── SECTION HEADER ─────────────────────────────────────
export function SectionLabel({ children }) {
  return <span className="section-label">{children}</span>
}

// ── FAB ───────────────────────────────────────────────
export function FAB({ icon = '+', onClick, label }) {
  return (
    <button className="btn-fab" onClick={onClick} aria-label={label || 'Add'}>
      {icon}
    </button>
  )
}
