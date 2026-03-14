// ═══════════════════════════════════════════════════════
//  RAM.OS — Notes Page
//  File: src/pages/Notes.jsx
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { fetchItems, createItem, updateItem, deleteItem, relativeTime, lsGet, lsSet } from '../lib/api'
import { useApp } from '../lib/context'
import { Modal, ConfirmModal, PageHeader, EmptyState, FAB, Spinner, FormGroup } from '../components/UI'

function blankNote() { return { title: '', content: '', color: '' } }

const NOTE_COLORS = ['', '#8b1a3a', '#1a5c8b', '#1a8b4a', '#8b5a1a', '#5a1a8b']

export default function Notes() {
  const { showToast, addToSearchIndex } = useApp()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankNote())
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchItems('notes')
      setNotes(data)
      addToSearchIndex(data.map(n => ({ id: n.id, title: n.title || 'Untitled', content: n.content, type: 'Note', icon: '📓', path: '/notes' })))
      lsSet('notes', data)
    } catch {
      setNotes(lsGet('notes', []))
    } finally { setLoading(false) }
  }

  function openNew() { setEditing(null); setForm(blankNote()); setModalOpen(true) }
  function openEdit(n) {
    setEditing(n.id)
    setForm({ title: n.title || '', content: n.content || '', color: n.color || '' })
    setModalOpen(true)
  }

  async function save() {
    if (!form.content.trim() && !form.title.trim()) { showToast('Write something first', 'error'); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateItem('notes', editing, form)
        setNotes(p => p.map(n => n.id === editing ? { ...n, ...updated } : n))
        showToast('Note saved', 'success')
      } else {
        const created = await createItem('notes', form)
        setNotes(p => [created, ...p])
        showToast('Note created', 'success')
      }
      setModalOpen(false)
    } catch (e) { showToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function doDelete(id) {
    try {
      await deleteItem('notes', id)
      setNotes(p => p.filter(n => n.id !== id))
      showToast('Note deleted', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  const filtered = notes.filter(n =>
    !search ||
    (n.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Notes"
        subtitle={`${notes.length} notes`}
        actions={<button className="btn btn-primary btn-sm" onClick={openNew}>+ Note</button>}
      />

      <input className="inp" placeholder="Search notes…" value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16 }} />

      {filtered.length === 0 ? (
        <EmptyState icon="📓" title="No notes yet" sub="Capture your thoughts" />
      ) : (
        <div className="notes-grid">
          {filtered.map(n => (
            <div
              key={n.id}
              className="note-card"
              onClick={() => openEdit(n)}
              style={n.color ? { borderLeftColor: n.color, borderLeftWidth: 3 } : {}}
            >
              <div className="note-title">{n.title || 'Untitled'}</div>
              <div className="note-preview">{n.content}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div className="note-time">{relativeTime(n.updatedAt)}</div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 6px', fontSize: 11 }}
                  onClick={e => { e.stopPropagation(); setDeleteId(n.id) }}
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FAB onClick={openNew} label="New note" />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Note' : 'New Note'}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? '⏳' : 'Save'}
            </button>
          </>
        }
      >
        <FormGroup label="Title">
          <input className="inp" placeholder="Note title (optional)" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
        </FormGroup>
        <FormGroup label="Color accent">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {NOTE_COLORS.map(c => (
              <div
                key={c || 'none'}
                onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: c || 'var(--bg4)',
                  border: form.color === c ? '3px solid var(--txt)' : '2px solid var(--bdr)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </FormGroup>
        <FormGroup label="Content">
          <textarea className="inp" placeholder="Write your note…" value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={10} style={{ minHeight: 180 }} />
        </FormGroup>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => doDelete(deleteId)}
        message="Delete this note permanently?"
      />
    </div>
  )
}
