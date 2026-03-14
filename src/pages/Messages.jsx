// ═══════════════════════════════════════════════════════
//  RAM.OS — Messages Page
//  File: src/pages/Messages.jsx
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { fetchMessages, markMessageRead, markAllMessagesRead, deleteMessage, relativeTime } from '../lib/api'
import { useApp } from '../lib/context'
import { ConfirmModal, PageHeader, StatsRow, FilterPills, EmptyState, Spinner } from '../components/UI'

const FILTERS = [
  { label: 'All', value: 'all' }, { label: 'Unread', value: 'unread' }, { label: 'Read', value: 'read' }
]

export default function Messages() {
  const { showToast, updateBadge } = useApp()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchMessages()
      setMessages(data)
      updateBadge('messages', data.filter(m => !m.read).length)
    } catch (e) { showToast('Failed to load', 'error') }
    finally { setLoading(false) }
  }

  async function markRead(id) {
    try {
      await markMessageRead(id)
      setMessages(p => p.map(m => m.id === id ? { ...m, read: true } : m))
      updateBadge('messages', messages.filter(m => !m.read && m.id !== id).length)
    } catch (e) { showToast(e.message, 'error') }
  }

  async function markAll() {
    try {
      await markAllMessagesRead()
      setMessages(p => p.map(m => ({ ...m, read: true })))
      updateBadge('messages', 0)
      showToast('All marked read', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  async function doDelete(id) {
    try {
      await deleteMessage(id)
      setMessages(p => p.filter(m => m.id !== id))
      showToast('Deleted', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  const filtered = messages.filter(m => {
    if (filter === 'unread' && m.read) return false
    if (filter === 'read' && !m.read) return false
    if (search) {
      const q = search.toLowerCase()
      if (!m.name?.toLowerCase().includes(q) && !m.email?.toLowerCase().includes(q) && !m.message?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const unread = messages.filter(m => !m.read).length
  const today = new Date().toISOString().split('T')[0]
  const todayCount = messages.filter(m => m.createdAt?.startsWith(today)).length

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Contact form submissions"
        actions={<button className="btn btn-ghost btn-sm" onClick={markAll}>✓ All Read</button>}
      />

      <StatsRow stats={[
        { label: 'Total', value: messages.length },
        { label: 'Unread', value: unread },
        { label: 'Today', value: todayCount },
      ]} />

      <input className="inp" placeholder="Search messages…" value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
      <FilterPills options={FILTERS} value={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <EmptyState icon="✉️" title="No messages" sub="Contact form messages appear here" />
      ) : filtered.map(msg => (
        <div key={msg.id} className={`msg-card ${!msg.read ? 'unread' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="msg-name">{msg.name} {!msg.read && <span style={{ fontSize: 10, background: 'var(--acc)', color: '#fff', borderRadius: 4, padding: '1px 5px', marginLeft: 6 }}>NEW</span>}</div>
              <div className="msg-email">📧 {msg.email}</div>
            </div>
            <div className="msg-time">{relativeTime(msg.createdAt)}</div>
          </div>
          <div className="msg-text">{msg.message}</div>
          <div className="msg-actions">
            {!msg.read && <button className="btn btn-ghost btn-sm" onClick={() => markRead(msg.id)}>✓ Read</button>}
            <a href={`mailto:${msg.email}`} className="btn btn-ghost btn-sm">↗ Reply</a>
            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(msg.id)}>🗑</button>
          </div>
        </div>
      ))}

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => doDelete(deleteId)} message="Delete this message?" />
    </div>
  )
}
