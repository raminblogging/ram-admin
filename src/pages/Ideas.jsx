// ═══════════════════════════════════════════════════════
//  RAM.OS — Ideas Page
//  File: src/pages/Ideas.jsx
// ═══════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { lsGet, lsSet, relativeTime, newId } from '../lib/api'
import { useApp } from '../lib/context'
import { Modal, ConfirmModal, PageHeader, FilterPills, EmptyState, FAB, FormGroup } from '../components/UI'

const STATUSES = [
  { label: 'All',     value: 'all' },
  { label: '💡 New',  value: 'new' },
  { label: '⚡ Active', value: 'active' },
  { label: '✅ Done', value: 'done' },
  { label: '🗑 Archived', value: 'archived' },
]

function blank() { return { title: '', description: '', status: 'new', priority: 'medium' } }

export default function Ideas() {
  const { showToast, updateBadge } = useApp()
  const [ideas, setIdeas] = useState(() => lsGet('ideas', []))
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank())
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    updateBadge('ideas', ideas.filter(i => i.status === 'new').length)
  }, [ideas])

  function save() {
    if (!form.title.trim()) { showToast('Title required', 'error'); return }
    if (editing) {
      const updated = ideas.map(i => i.id === editing ? { ...i, ...form, updatedAt: new Date().toISOString() } : i)
      setIdeas(updated); lsSet('ideas', updated)
    } else {
      const idea = { ...form, id: newId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      const updated = [idea, ...ideas]
      setIdeas(updated); lsSet('ideas', updated)
    }
    showToast('Saved', 'success'); setModalOpen(false)
  }

  function doDelete(id) {
    const updated = ideas.filter(i => i.id !== id)
    setIdeas(updated); lsSet('ideas', updated)
    showToast('Deleted', 'success')
  }

  function changeStatus(id, status) {
    const updated = ideas.map(i => i.id === id ? { ...i, status } : i)
    setIdeas(updated); lsSet('ideas', updated)
  }

  const STATUS_COLORS = { new: '#2563eb', active: '#d97706', done: '#16a34a', archived: '#6b7280' }

  const filtered = ideas.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false
    if (search && !i.title?.toLowerCase().includes(search.toLowerCase()) && !i.description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <PageHeader title="Ideas" subtitle={`${ideas.length} ideas captured`}
        actions={<button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setForm(blank()); setModalOpen(true) }}>+ Idea</button>} />

      <input className="inp" placeholder="Search ideas…" value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
      <FilterPills options={STATUSES} value={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <EmptyState icon="💡" title="No ideas here" sub="Capture your next big idea" />
      ) : filtered.map(idea => (
        <div key={idea.id} className="idea-card" style={{ borderLeftColor: STATUS_COLORS[idea.status] || 'var(--acc)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div className="idea-title">{idea.title}</div>
            <select
              value={idea.status}
              onChange={e => changeStatus(idea.id, e.target.value)}
              style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '3px 6px', fontSize: 11, color: 'var(--txt2)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="new">💡 New</option>
              <option value="active">⚡ Active</option>
              <option value="done">✅ Done</option>
              <option value="archived">🗑 Archive</option>
            </select>
          </div>
          {idea.description && <div className="idea-desc">{idea.description}</div>}
          <div className="idea-footer">
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{relativeTime(idea.updatedAt)}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(idea.id); setForm({ title: idea.title, description: idea.description || '', status: idea.status, priority: idea.priority || 'medium' }); setModalOpen(true) }}>✏️</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(idea.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}

      <FAB onClick={() => { setEditing(null); setForm(blank()); setModalOpen(true) }} label="New idea" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Idea' : 'New Idea'}
        actions={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
        <FormGroup label="Title">
          <input className="inp" placeholder="What's the idea?" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
        </FormGroup>
        <FormGroup label="Description">
          <textarea className="inp" placeholder="Expand on the idea…" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
        </FormGroup>
        <FormGroup label="Status">
          <select className="inp" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="new">💡 New</option>
            <option value="active">⚡ Active</option>
            <option value="done">✅ Done</option>
            <option value="archived">Archive</option>
          </select>
        </FormGroup>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => { doDelete(deleteId); setDeleteId(null) }} message="Delete this idea?" />
    </div>
  )
}
