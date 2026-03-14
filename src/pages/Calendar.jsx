// ═══════════════════════════════════════════════════════
//  RAM.OS — Calendar Page
//  File: src/pages/Calendar.jsx
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { fetchItems, createItem, updateItem, deleteItem, lsGet, lsSet } from '../lib/api'
import { useApp } from '../lib/context'
import { Modal, ConfirmModal, PageHeader, EmptyState, FAB, Spinner, FormGroup } from '../components/UI'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function blankEvent() { return { title: '', date: new Date().toISOString().split('T')[0], time: '', notes: '', color: '#8b1a3a' } }

export default function Calendar() {
  const { showToast } = useApp()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankEvent())
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchItems('events')
      setEvents(data); lsSet('events', data)
    } catch { setEvents(lsGet('events', [])) }
    finally { setLoading(false) }
  }

  function buildCalendar(date) {
    const year = date.getFullYear(), month = date.getMonth()
    const first = new Date(year, month, 1)
    const last  = new Date(year, month + 1, 0)
    // Monday-based week
    let startDow = first.getDay() - 1; if (startDow < 0) startDow = 6
    const days = []
    // Prev month fill
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: d, current: false })
    }
    // Current month
    for (let d = 1; d <= last.getDate(); d++) {
      days.push({ date: new Date(year, month, d), current: true })
    }
    // Next month fill
    const rem = 7 - (days.length % 7); if (rem < 7) {
      for (let i = 1; i <= rem; i++) days.push({ date: new Date(year, month + 1, i), current: false })
    }
    return days
  }

  function dateStr(d) { return d.toISOString().split('T')[0] }
  const today = dateStr(new Date())
  const calDays = buildCalendar(viewDate)

  const eventsOnDay = (d) => events.filter(e => e.date === dateStr(d))

  function openNew(date) {
    setEditing(null)
    setForm({ ...blankEvent(), date: dateStr(date) })
    setModalOpen(true)
  }
  function openEdit(ev) {
    setEditing(ev.id)
    setForm({ title: ev.title || '', date: ev.date || '', time: ev.time || '', notes: ev.notes || '', color: ev.color || '#8b1a3a' })
    setModalOpen(true)
  }

  async function save() {
    if (!form.title.trim()) { showToast('Title required', 'error'); return }
    setSaving(true)
    try {
      if (editing) {
        const u = await updateItem('events', editing, form)
        setEvents(p => p.map(e => e.id === editing ? { ...e, ...u } : e))
      } else {
        const c = await createItem('events', form)
        setEvents(p => [c, ...p])
      }
      showToast('Event saved', 'success'); setModalOpen(false)
    } catch (e) { showToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function doDelete(id) {
    try {
      await deleteItem('events', id)
      setEvents(p => p.filter(e => e.id !== id)); showToast('Deleted', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  const selEvents = selectedDate ? eventsOnDay(selectedDate) : []

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Calendar"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}>←</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date())}>Today</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}>→</button>
          </div>
        }
      />

      <div style={{ textAlign: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--txt)' }}>
        {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
      </div>

      <div className="calendar-grid" style={{ marginBottom: 4 }}>
        {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
      </div>
      <div className="calendar-grid" style={{ marginBottom: 20 }}>
        {calDays.map((day, i) => {
          const ds = dateStr(day.date)
          const hasEv = eventsOnDay(day.date).length > 0
          const isSelected = selectedDate && dateStr(selectedDate) === ds
          return (
            <div
              key={i}
              className={`cal-day ${ds === today ? 'today' : ''} ${!day.current ? 'other-month' : ''} ${hasEv ? 'has-events' : ''}`}
              style={isSelected && ds !== today ? { background: 'var(--bg3)', border: '1px solid var(--acc)' } : {}}
              onClick={() => { setSelectedDate(day.date) }}
            >
              {day.date.getDate()}
            </div>
          )
        })}
      </div>

      {/* Selected day events */}
      {selectedDate && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>
              {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => openNew(selectedDate)}>+ Event</button>
          </div>
          {selEvents.length === 0 ? (
            <div style={{ color: 'var(--txt3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No events — add one!</div>
          ) : selEvents.map(ev => (
            <div key={ev.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 4, background: ev.color || 'var(--acc)', borderRadius: 2, alignSelf: 'stretch', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--txt)' }}>{ev.title}</div>
                {ev.time && <div style={{ fontSize: 12, color: 'var(--txt2)' }}>⏰ {ev.time}</div>}
                {ev.notes && <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 4 }}>{ev.notes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(ev)}>✏️</button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteId(ev.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FAB onClick={() => openNew(selectedDate || new Date())} label="Add event" />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Event' : 'New Event'}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳' : 'Save'}</button>
          </>
        }
      >
        <FormGroup label="Title">
          <input className="inp" placeholder="Event name" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
        </FormGroup>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormGroup label="Date">
            <input className="inp" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Time">
            <input className="inp" type="time" value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </FormGroup>
        </div>
        <FormGroup label="Notes">
          <textarea className="inp" placeholder="Details…" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
        </FormGroup>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => doDelete(deleteId)} message="Delete this event?" />
    </div>
  )
}
