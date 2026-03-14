// ═══════════════════════════════════════════════════════
//  RAM.OS — Habits Page
//  File: src/pages/Habits.jsx
// ═══════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { lsGet, lsSet, weekDays, todayStr } from '../lib/api'
import { useApp } from '../lib/context'
import { Modal, ConfirmModal, PageHeader, EmptyState, FAB, FormGroup } from '../components/UI'

const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function blankHabit() { return { name: '', emoji: '🔥', targetDays: 7 } }

export default function Habits() {
  const { showToast } = useApp()
  const [habits, setHabits] = useState(() => lsGet('habits', []))
  const [logs, setLogs] = useState(() => lsGet('habitLogs', {})) // { 'habitId-dateStr': true }
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankHabit())
  const [deleteId, setDeleteId] = useState(null)

  const days = weekDays()
  const today = todayStr()

  function save() {
    if (!form.name.trim()) { showToast('Name required', 'error'); return }
    if (editing !== null) {
      const updated = habits.map((h, i) => i === editing ? { ...h, ...form } : h)
      setHabits(updated); lsSet('habits', updated)
    } else {
      const updated = [...habits, { ...form, id: Date.now().toString(36) }]
      setHabits(updated); lsSet('habits', updated)
    }
    showToast('Saved', 'success'); setModalOpen(false)
  }

  function toggleLog(habitId, date) {
    const key = `${habitId}-${date}`
    const updated = { ...logs, [key]: !logs[key] }
    if (!updated[key]) delete updated[key]
    setLogs(updated); lsSet('habitLogs', updated)
  }

  function doDelete(idx) {
    const updated = habits.filter((_, i) => i !== idx)
    setHabits(updated); lsSet('habits', updated)
    showToast('Deleted', 'success')
  }

  function getStreak(habit) {
    let streak = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().split('T')[0]
      if (logs[`${habit.id}-${ds}`]) { streak++; d.setDate(d.getDate() - 1) }
      else break
    }
    return streak
  }

  const EMOJIS = ['🔥','💪','📚','🧘','🏃','💧','🥗','😴','🎯','✍️','🎵','🧹']

  return (
    <div>
      <PageHeader title="Habits" subtitle="Build streaks, build yourself"
        actions={<button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setForm(blankHabit()); setModalOpen(true) }}>+ Habit</button>} />

      {/* Week header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 32px)', gap: 4, marginBottom: 12, alignItems: 'center' }}>
        <div />
        {DAY_LABELS.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 700, color: days[i] === today ? 'var(--acc3)' : 'var(--txt3)',
            textTransform: 'uppercase',
          }}>{d}</div>
        ))}
      </div>

      {habits.length === 0 ? (
        <EmptyState icon="🔥" title="No habits yet" sub="Track daily habits and build streaks" />
      ) : habits.map((habit, idx) => {
        const streak = getStreak(habit)
        return (
          <div key={habit.id || idx} className="habit-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 32px)', gap: 4, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{habit.emoji}</span>
                <div>
                  <div className="habit-name">{habit.name}</div>
                  {streak > 0 && <div className="habit-streak">🔥 {streak} day streak</div>}
                </div>
              </div>
              {days.map((day, di) => {
                const key = `${habit.id || idx}-${day}`
                const done = !!logs[key]
                const isFuture = day > today
                return (
                  <div key={day} className={`habit-dot ${done ? 'done' : ''}`}
                    style={{ opacity: isFuture ? 0.3 : 1 }}
                    onClick={() => !isFuture && toggleLog(habit.id || String(idx), day)}>
                    {done ? '✓' : ''}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(idx); setForm({ name: habit.name, emoji: habit.emoji, targetDays: habit.targetDays }); setModalOpen(true) }}>✏️</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(idx)}>🗑</button>
            </div>
          </div>
        )
      })}

      <FAB onClick={() => { setEditing(null); setForm(blankHabit()); setModalOpen(true) }} label="New habit" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing !== null ? 'Edit Habit' : 'New Habit'}
        actions={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
        <FormGroup label="Habit Name">
          <input className="inp" placeholder="e.g. Drink 2L water" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
        </FormGroup>
        <FormGroup label="Emoji">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EMOJIS.map(em => (
              <button key={em} onClick={() => setForm(f => ({ ...f, emoji: em }))}
                style={{ width: 40, height: 40, borderRadius: 10, fontSize: 22, background: form.emoji === em ? 'var(--acc)' : 'var(--bg3)', border: `1px solid ${form.emoji === em ? 'var(--acc)' : 'var(--bdr)'}`, cursor: 'pointer' }}>
                {em}
              </button>
            ))}
          </div>
        </FormGroup>
      </Modal>

      <ConfirmModal open={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => { doDelete(deleteId); setDeleteId(null) }} message="Delete this habit and all logs?" />
    </div>
  )
}
