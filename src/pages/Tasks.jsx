// ═══════════════════════════════════════════════════════
//  RAM.OS — Tasks Page (Enhanced)
//  File: src/pages/Tasks.jsx
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { fetchItems, createItem, updateItem, deleteItem, formatDate, lsGet, lsSet, newId } from '../lib/api'
import { useApp } from '../lib/context'
import { Modal, ConfirmModal, PageHeader, StatsRow, FilterPills, EmptyState, FAB, Spinner, FormGroup } from '../components/UI'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const PRIORITY_COLORS = { low: '#6b7280', medium: '#d97706', high: '#dc2626', urgent: '#9333ea' }
const PRIORITY_ICONS  = { low: '🟢', medium: '🟡', high: '🔴', urgent: '🚨' }
const RECURRENCE = ['none', 'daily', 'weekly', 'monthly']
const RECURRENCE_ICONS = { none: '—', daily: '🔁 Daily', weekly: '📆 Weekly', monthly: '🗓️ Monthly' }

const FILTERS = [
  { label: 'All',       value: 'all' },
  { label: 'Open',      value: 'open' },
  { label: 'Done',      value: 'done' },
  { label: '🔴 High',   value: 'high' },
  { label: '🚨 Urgent', value: 'urgent' },
  { label: '📅 Due',    value: 'due' },
  { label: '🔁 Repeat', value: 'repeat' },
]

function blankTask() {
  return {
    title: '', notes: '', priority: 'medium', dueDate: '', dueTime: '',
    categoryId: '', done: false, subtasks: [], tags: '',
    estimateMin: '', recurrence: 'none',
  }
}

function SubtaskList({ subtasks, onChange }) {
  const [newItem, setNewItem] = useState('')
  function addSubtask() {
    if (!newItem.trim()) return
    onChange([...subtasks, { id: Date.now().toString(36), title: newItem.trim(), done: false }])
    setNewItem('')
  }
  function toggleSubtask(id) { onChange(subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s)) }
  function removeSubtask(id) { onChange(subtasks.filter(s => s.id !== id)) }
  return (
    <div>
      {subtasks.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '6px 10px', background: 'var(--bg3)', borderRadius: 8 }}>
          <div onClick={() => toggleSubtask(s.id)}
            style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid var(--bdr)', background: s.done ? 'var(--acc)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: '#fff' }}>
            {s.done ? '✓' : ''}
          </div>
          <span style={{ flex: 1, fontSize: 13, textDecoration: s.done ? 'line-through' : 'none', color: s.done ? 'var(--txt3)' : 'var(--txt)' }}>{s.title}</span>
          <button onClick={() => removeSubtask(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <input className="inp" placeholder="Add subtask…" value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
          style={{ fontSize: 13 }} />
        <button className="btn btn-primary btn-sm" onClick={addSubtask}>+</button>
      </div>
    </div>
  )
}

export default function Tasks() {
  const { showToast, updateBadge, addToSearchIndex } = useApp()
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankTask())
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [t, c] = await Promise.all([fetchItems('tasks'), fetchItems('categories')])
      setTasks(t); setCategories(c)
      updateBadge('tasks', t.filter(x => !x.done).length)
      addToSearchIndex(t.map(x => ({ id: x.id, title: x.title, type: 'Task', icon: '✅', path: '/tasks' })))
      lsSet('tasks', t)
    } catch { setTasks(lsGet('tasks', [])) }
    finally { setLoading(false) }
  }

  function openNew() { setEditing(null); setForm(blankTask()); setActiveTab('basic'); setModalOpen(true) }

  function openEdit(t) {
    setEditing(t.id)
    setForm({
      title: t.title || '', notes: t.notes || '', priority: t.priority || 'medium',
      dueDate: t.dueDate || '', dueTime: t.dueTime || '', categoryId: t.categoryId || '',
      done: !!t.done, subtasks: t.subtasks || [], tags: t.tags || '',
      estimateMin: t.estimateMin || '', recurrence: t.recurrence || 'none',
    })
    setActiveTab('basic'); setModalOpen(true)
  }

  async function saveTask() {
    if (!form.title.trim()) { showToast('Title is required', 'error'); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateItem('tasks', editing, form)
        setTasks(p => p.map(t => t.id === editing ? { ...t, ...updated } : t))
        showToast('Task updated', 'success')
      } else {
        const created = await createItem('tasks', form)
        setTasks(p => [created, ...p])
        showToast('Task created', 'success')
      }
      updateBadge('tasks', tasks.filter(t => !t.done).length)
      setModalOpen(false)
    } catch (e) { showToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function toggleDone(task) {
    try {
      const updated = await updateItem('tasks', task.id, { done: !task.done })
      setTasks(p => p.map(t => t.id === task.id ? { ...t, ...updated } : t))
      updateBadge('tasks', tasks.filter(t => !t.done && t.id !== task.id).length)
    } catch (e) { showToast(e.message, 'error') }
  }

  async function doDelete(id) {
    try {
      await deleteItem('tasks', id)
      setTasks(p => p.filter(t => t.id !== id))
      showToast('Task deleted', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  async function updateSubtaskInline(taskId, subtasks) {
    try {
      const updated = await updateItem('tasks', taskId, { subtasks })
      setTasks(p => p.map(t => t.id === taskId ? { ...t, ...updated } : t))
    } catch (e) { showToast(e.message, 'error') }
  }

  const today = new Date().toISOString().split('T')[0]
  const filtered = tasks.filter(t => {
    if (filter === 'open'   && t.done) return false
    if (filter === 'done'   && !t.done) return false
    if (filter === 'high'   && t.priority !== 'high') return false
    if (filter === 'urgent' && t.priority !== 'urgent') return false
    if (filter === 'due'    && (!t.dueDate || t.dueDate > today)) return false
    if (filter === 'repeat' && (!t.recurrence || t.recurrence === 'none')) return false
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const total   = tasks.length
  const open    = tasks.filter(t => !t.done).length
  const done    = tasks.filter(t => t.done).length
  const overdue = tasks.filter(t => !t.done && t.dueDate && t.dueDate < today).length

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Tasks" actions={<button className="btn btn-primary btn-sm" onClick={openNew}>+ Add</button>} />

      <StatsRow stats={[
        { label: 'Total', value: total },
        { label: 'Open',  value: open },
        { label: 'Done',  value: done },
        { label: '⚠️ Due', value: overdue },
      ]} />

      <input className="inp" placeholder="Search tasks…" value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />

      <FilterPills options={FILTERS} value={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <EmptyState icon="✅" title="No tasks here" sub="Add your first task to get started" />
      ) : filtered.map(task => {
        const cat = categories.find(c => c.id === task.categoryId)
        const taskOverdue = task.dueDate && task.dueDate < today && !task.done
        const subtasks = task.subtasks || []
        const subDone = subtasks.filter(s => s.done).length
        const isExpanded = expandedId === task.id
        const tags = task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        return (
          <div key={task.id} style={{ marginBottom: 8 }}>
            <div className={`item-row ${task.done ? 'done' : ''}`} style={{ alignItems: 'flex-start', paddingTop: 10, paddingBottom: 8 }}>
              <div className={`item-check ${task.done ? 'checked' : ''}`} style={{ marginTop: 2 }} onClick={() => toggleDone(task)}>
                {task.done ? '✓' : ''}
              </div>
              <div className="item-body" onClick={() => openEdit(task)} style={{ flex: 1 }}>
                <div className="item-title" style={{ textDecoration: task.done ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: PRIORITY_COLORS[task.priority] }}>{PRIORITY_ICONS[task.priority]}</span>
                  {task.title}
                  {task.recurrence && task.recurrence !== 'none' && (
                    <span style={{ fontSize: 12, color: 'var(--txt3)' }}>🔁</span>
                  )}
                </div>
                <div className="item-meta" style={{ flexWrap: 'wrap', gap: '4px 10px' }}>
                  {cat && <span style={{ color: cat.color || 'var(--txt2)' }}>{cat.icon} {cat.name}</span>}
                  {task.dueDate && (
                    <span style={{ color: taskOverdue ? 'var(--acc3)' : 'var(--txt2)' }}>
                      📅 {formatDate(task.dueDate)}{task.dueTime ? ` ${task.dueTime}` : ''}{taskOverdue ? ' ⚠️' : ''}
                    </span>
                  )}
                  {task.estimateMin && <span>⏱ {task.estimateMin}m</span>}
                  {subtasks.length > 0 && (
                    <span style={{ color: subDone === subtasks.length ? '#16a34a' : 'var(--txt2)' }}>
                      ☑ {subDone}/{subtasks.length}
                    </span>
                  )}
                  {tags.map(tag => (
                    <span key={tag} style={{ background: 'var(--bg4)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>#{tag}</span>
                  ))}
                </div>
                {subtasks.length > 0 && (
                  <div style={{ marginTop: 6, background: 'var(--bg4)', borderRadius: 3, height: 3, overflow: 'hidden' }}>
                    <div style={{ background: 'var(--acc)', height: '100%', width: `${(subDone / subtasks.length) * 100}%`, borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                )}
              </div>
              <div className="item-actions" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {subtasks.length > 0 && (
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : task.id) }}>
                    {isExpanded ? '▲' : '▼'}
                  </button>
                )}
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteId(task.id)}>🗑</button>
              </div>
            </div>

            {isExpanded && subtasks.length > 0 && (
              <div style={{ marginLeft: 44, marginRight: 12, marginBottom: 8, padding: '8px 10px', background: 'var(--bg2)', borderRadius: 8 }}>
                {subtasks.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--bdr)' }}>
                    <div onClick={() => updateSubtaskInline(task.id, subtasks.map(x => x.id === s.id ? { ...x, done: !x.done } : x))}
                      style={{ width: 16, height: 16, borderRadius: 3, border: '2px solid var(--bdr)', background: s.done ? 'var(--acc)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: '#fff' }}>
                      {s.done ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: 13, textDecoration: s.done ? 'line-through' : 'none', color: s.done ? 'var(--txt3)' : 'var(--txt)' }}>{s.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <FAB onClick={openNew} label="Add task" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Task' : 'New Task'}
        actions={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={saveTask} disabled={saving}>{saving ? '⏳' : editing ? 'Save' : 'Create'}</button></>}>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--bdr)', paddingBottom: 10 }}>
          {[{ id: 'basic', label: '📋 Basic' }, { id: 'subtasks', label: `☑ Subtasks${form.subtasks.length > 0 ? ` (${form.subtasks.length})` : ''}` }, { id: 'advanced', label: '⚙️ Advanced' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: activeTab === tab.id ? 'var(--acc)' : 'var(--bg3)', color: activeTab === tab.id ? '#fff' : 'var(--txt2)' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'basic' && <>
          <FormGroup label="Title">
            <input className="inp" placeholder="What needs to be done?" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </FormGroup>
          <FormGroup label="Priority">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRIORITIES.map(p => (
                <button key={p} className={`pill ${form.priority === p ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, priority: p }))}>
                  {PRIORITY_ICONS[p]} {p}
                </button>
              ))}
            </div>
          </FormGroup>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormGroup label="Due Date">
              <input className="inp" type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Due Time">
              <input className="inp" type="time" value={form.dueTime}
                onChange={e => setForm(f => ({ ...f, dueTime: e.target.value }))} />
            </FormGroup>
          </div>
          {categories.length > 0 && (
            <FormGroup label="Category">
              <select className="inp" value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </FormGroup>
          )}
          <FormGroup label="Notes">
            <textarea className="inp" placeholder="Additional notes…" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          </FormGroup>
        </>}

        {activeTab === 'subtasks' && (
          <FormGroup label={`Subtasks — ${form.subtasks.filter(s => s.done).length}/${form.subtasks.length} done`}>
            <SubtaskList subtasks={form.subtasks} onChange={subtasks => setForm(f => ({ ...f, subtasks }))} />
          </FormGroup>
        )}

        {activeTab === 'advanced' && <>
          <FormGroup label="Recurrence">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {RECURRENCE.map(r => (
                <button key={r} className={`pill ${form.recurrence === r ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, recurrence: r }))}>
                  {RECURRENCE_ICONS[r]}
                </button>
              ))}
            </div>
          </FormGroup>
          <FormGroup label="Time Estimate (minutes)">
            <input className="inp" type="number" placeholder="e.g. 30" value={form.estimateMin}
              onChange={e => setForm(f => ({ ...f, estimateMin: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Tags (comma-separated)">
            <input className="inp" placeholder="e.g. work, urgent, design" value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            {form.tags && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {form.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} style={{ background: 'var(--bg4)', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: 'var(--txt2)' }}>#{tag}</span>
                ))}
              </div>
            )}
          </FormGroup>
          <FormGroup label="Status">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', color: 'var(--txt)' }}>
              <input type="checkbox" checked={form.done} onChange={e => setForm(f => ({ ...f, done: e.target.checked }))} />
              Mark as completed
            </label>
          </FormGroup>
        </>}
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => doDelete(deleteId)} message="Delete this task permanently?" />
    </div>
  )
}
