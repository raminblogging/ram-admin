// ═══════════════════════════════════════════════════════
//  RAM.OS — Categories Page
//  File: src/pages/Categories.jsx
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { fetchItems, createItem, updateItem, deleteItem } from '../lib/api'
import { useApp } from '../lib/context'
import { Modal, ConfirmModal, PageHeader, EmptyState, FAB, Spinner, FormGroup } from '../components/UI'

const PRESET_COLORS = ['#8b1a3a','#2563eb','#16a34a','#d97706','#9333ea','#0891b2','#ea580c','#db2777']
const PRESET_ICONS  = ['💼','🙋','💪','🧠','🏠','🎯','📚','🎨','🏋️','💡','🔬','🎵','✈️','🍕']

function blank() { return { name: '', icon: '💼', color: '#8b1a3a' } }

export default function Categories() {
  const { showToast } = useApp()
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank())
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const data = await fetchItems('categories'); setCats(data) }
    catch (e) { showToast('Failed to load', 'error') }
    finally { setLoading(false) }
  }

  function openNew() { setEditing(null); setForm(blank()); setModalOpen(true) }
  function openEdit(c) { setEditing(c.id); setForm({ name: c.name || '', icon: c.icon || '💼', color: c.color || '#8b1a3a' }); setModalOpen(true) }

  async function save() {
    if (!form.name.trim()) { showToast('Name required', 'error'); return }
    setSaving(true)
    try {
      if (editing) {
        const u = await updateItem('categories', editing, form)
        setCats(p => p.map(c => c.id === editing ? { ...c, ...u } : c))
      } else {
        const c = await createItem('categories', form)
        setCats(p => [...p, c])
      }
      showToast('Saved', 'success'); setModalOpen(false)
    } catch (e) { showToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function doDelete(id) {
    try { await deleteItem('categories', id); setCats(p => p.filter(c => c.id !== id)); showToast('Deleted', 'success') }
    catch (e) { showToast(e.message, 'error') }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organise your tasks" actions={<button className="btn btn-primary btn-sm" onClick={openNew}>+ Add</button>} />

      {cats.length === 0 ? (
        <EmptyState icon="🏷️" title="No categories" sub="Create categories to organise tasks" />
      ) : cats.map(cat => (
        <div key={cat.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: cat.color + '30',
            border: `2px solid ${cat.color || 'var(--bdr)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0
          }}>
            {cat.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: cat.color || 'var(--txt)' }}>{cat.name}</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'monospace' }}>{cat.color}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(cat)}>✏️</button>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteId(cat.id)}>🗑</button>
          </div>
        </div>
      ))}

      <FAB onClick={openNew} label="New category" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'New Category'}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳' : 'Save'}</button>
          </>
        }
      >
        <FormGroup label="Name">
          <input className="inp" placeholder="Category name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
        </FormGroup>
        <FormGroup label="Icon">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_ICONS.map(ic => (
              <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                style={{
                  width: 40, height: 40, borderRadius: 10, fontSize: 20,
                  background: form.icon === ic ? 'var(--acc)' : 'var(--bg3)',
                  border: `1px solid ${form.icon === ic ? 'var(--acc)' : 'var(--bdr)'}`,
                  cursor: 'pointer',
                }}>
                {ic}
              </button>
            ))}
          </div>
        </FormGroup>
        <FormGroup label="Color">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {PRESET_COLORS.map(c => (
              <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{
                  width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: form.color === c ? '3px solid var(--txt)' : '2px solid transparent',
                }} />
            ))}
          </div>
          <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            style={{ width: 48, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
        </FormGroup>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => doDelete(deleteId)} message="Delete this category? Tasks using it won't be deleted." />
    </div>
  )
}
