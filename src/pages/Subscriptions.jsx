// ═══════════════════════════════════════════════════════
//  RAM.OS — Subscriptions Page
//  File: src/pages/Subscriptions.jsx
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { fetchSubscriptions, markSubRead, markAllSubsRead, deleteSubscription, relativeTime } from '../lib/api'
import { useApp } from '../lib/context'
import { ConfirmModal, PageHeader, StatsRow, FilterPills, EmptyState, Spinner } from '../components/UI'

const FILTERS = [
  { label: 'All', value: 'all' }, { label: 'New', value: 'unread' }, { label: 'Seen', value: 'read' }
]

export default function Subscriptions() {
  const { showToast, updateBadge } = useApp()
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchSubscriptions()
      setSubs(data)
      updateBadge('subscriptions', data.filter(s => !s.read).length)
    } catch (e) { showToast('Failed to load', 'error') }
    finally { setLoading(false) }
  }

  async function markRead(id) {
    try {
      await markSubRead(id)
      setSubs(p => p.map(s => s.id === id ? { ...s, read: true } : s))
      updateBadge('subscriptions', subs.filter(s => !s.read && s.id !== id).length)
    } catch {}
  }

  async function markAll() {
    try {
      await markAllSubsRead()
      setSubs(p => p.map(s => ({ ...s, read: true })))
      updateBadge('subscriptions', 0)
      showToast('All marked seen', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  async function doDelete(id) {
    try {
      await deleteSubscription(id)
      setSubs(p => p.filter(s => s.id !== id))
      showToast('Removed', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  function exportCSV() {
    const rows = [['Email', 'Name', 'Date'], ...subs.map(s => [s.email, s.name || '', s.createdAt || ''])]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'subscribers.csv'; a.click()
  }

  const filtered = subs.filter(s => {
    if (filter === 'unread' && s.read) return false
    if (filter === 'read' && !s.read) return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.email?.toLowerCase().includes(q) && !s.name?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const unseen = subs.filter(s => !s.read).length
  const today = new Date().toISOString().split('T')[0]
  const todayCount = subs.filter(s => s.createdAt?.startsWith(today)).length

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle="Newsletter subscribers"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={exportCSV}>↓ CSV</button>
            <button className="btn btn-ghost btn-sm" onClick={markAll}>✓ All Seen</button>
          </div>
        }
      />

      <StatsRow stats={[
        { label: 'Total', value: subs.length },
        { label: 'New', value: unseen },
        { label: 'Today', value: todayCount },
      ]} />

      <input className="inp" placeholder="Search subscribers…" value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
      <FilterPills options={FILTERS} value={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <EmptyState icon="📬" title="No subscribers yet" sub="Subscribers from your website appear here" />
      ) : filtered.map(sub => (
        <div key={sub.id} className={`msg-card ${!sub.read ? 'unread' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="msg-name">
                {sub.name || sub.email}
                {!sub.read && <span style={{ fontSize: 10, background: 'var(--acc)', color: '#fff', borderRadius: 4, padding: '1px 5px', marginLeft: 6 }}>NEW</span>}
              </div>
              <div className="msg-email">📧 {sub.email}</div>
            </div>
            <div className="msg-time">{relativeTime(sub.createdAt)}</div>
          </div>
          <div className="msg-actions">
            {!sub.read && <button className="btn btn-ghost btn-sm" onClick={() => markRead(sub.id)}>✓ Seen</button>}
            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(sub.id)}>🗑 Remove</button>
          </div>
        </div>
      ))}

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => doDelete(deleteId)} message="Remove this subscriber?" />
    </div>
  )
}
