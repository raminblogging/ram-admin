// ═══════════════════════════════════════════════════════
//  RAM.OS — Blog Admin Page
//  File: src/pages/Blog.jsx
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { fetchBlogs, createBlog, updateBlog, deleteBlog, reorderBlogs, aiOptimize, slugify, relativeTime } from '../lib/api'
import { useApp } from '../lib/context'
import { Modal, ConfirmModal, PageHeader, StatsRow, FilterPills, EmptyState, Spinner, FormGroup, Badge } from '../components/UI'

const FILTERS = [
  { label: 'All',       value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Draft',     value: 'draft' },
]

function blankPost() {
  return {
    title: '', slug: '', description: '', content: '', status: 'draft',
    tags: [], featuredImage: '', publishDate: '',
    seoTitle: '', seoDescription: '', seoKeywords: '',
    ogTitle: '', ogImage: '', canonical: '',
    shareTextX: '', shareTextLinkedin: '', shareTextInstagram: '',
  }
}

export default function Blog() {
  const { showToast } = useApp()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankPost())
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [aiLoading, setAiLoading] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const data = await fetchBlogs(); setPosts(data) }
    catch (e) { showToast('Failed to load posts', 'error') }
    finally { setLoading(false) }
  }

  function openNew() {
    setEditing(null); setForm(blankPost()); setTagsInput(''); setActiveTab('content'); setModalOpen(true)
  }
  function openEdit(p) {
    setEditing(p.id)
    setForm({ ...blankPost(), ...p, tags: p.tags || [] })
    setTagsInput((p.tags || []).join(', '))
    setActiveTab('content'); setModalOpen(true)
  }

  const setF = (field) => (e) => {
    const val = e.target ? e.target.value : e
    setForm(f => {
      const next = { ...f, [field]: val }
      if (field === 'title' && !editing) next.slug = slugify(val)
      return next
    })
  }

  async function aiAction(type) {
    setAiLoading(type)
    try {
      const res = await aiOptimize({ type, title: form.title, description: form.description, content: form.content })
      const fieldMap = {
        seo_title: 'seoTitle', seo_desc: 'seoDescription', keywords: 'seoKeywords',
        improve_desc: 'description', share_x: 'shareTextX',
        share_linkedin: 'shareTextLinkedin', share_instagram: 'shareTextInstagram',
      }
      if (fieldMap[type]) setForm(f => ({ ...f, [fieldMap[type]]: res.result }))
      showToast('AI result applied ✨', 'success')
    } catch (e) { showToast('AI: ' + e.message, 'error') }
    finally { setAiLoading('') }
  }

  async function save() {
    if (!form.title.trim()) { showToast('Title required', 'error'); return }
    if (!form.slug.trim()) { showToast('Slug required', 'error'); return }
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    setSaving(true)
    try {
      const payload = { ...form, tags }
      if (editing) {
        const u = await updateBlog(editing, payload)
        setPosts(p => p.map(x => x.id === editing ? { ...x, ...u } : x))
      } else {
        const c = await createBlog(payload)
        setPosts(p => [c, ...p])
      }
      showToast('Post saved', 'success'); setModalOpen(false)
    } catch (e) { showToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function doDelete(id) {
    try { await deleteBlog(id); setPosts(p => p.filter(x => x.id !== id)); showToast('Deleted', 'success') }
    catch (e) { showToast(e.message, 'error') }
  }

  async function toggleStatus(post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    try {
      const u = await updateBlog(post.id, { ...post, status: newStatus })
      setPosts(p => p.map(x => x.id === post.id ? { ...x, ...u } : x))
      showToast(`Post ${newStatus}`, 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  const filtered = posts.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const published = posts.filter(p => p.status === 'published').length
  const drafts = posts.filter(p => p.status === 'draft').length

  const TABS = ['content', 'seo', 'social']

  const AiBtn = ({ type, label }) => (
    <button className="btn btn-ghost btn-sm" onClick={() => aiAction(type)} disabled={!!aiLoading}
      style={{ fontSize: 11 }}>
      {aiLoading === type ? '⏳' : '✨'} {label}
    </button>
  )

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Blog Posts"
        subtitle="Manage your content"
        actions={<button className="btn btn-primary btn-sm" onClick={openNew}>+ New Post</button>}
      />

      <StatsRow stats={[{ label: 'Total', value: posts.length }, { label: 'Published', value: published }, { label: 'Drafts', value: drafts }]} />

      <input className="inp" placeholder="Search posts…" value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />

      <FilterPills options={FILTERS} value={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <EmptyState icon="📝" title="No posts yet" sub="Create your first blog post" />
      ) : filtered.map(post => (
        <div key={post.id} className="blog-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div className="blog-card-title">{post.title}</div>
            <Badge color={post.status === 'published' ? 'green' : 'gray'}>
              {post.status}
            </Badge>
          </div>
          {post.description && (
            <div style={{ fontSize: 13, color: 'var(--txt2)', margin: '6px 0', lineHeight: 1.5 }}>{post.description}</div>
          )}
          <div className="blog-card-meta">
            <span>/{post.slug}</span>
            {post.tags?.length > 0 && <span>🏷️ {post.tags.join(', ')}</span>}
            <span>{relativeTime(post.updatedAt)}</span>
          </div>
          <div className="blog-card-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(post)}>✏️ Edit</button>
            <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(post)}>
              {post.status === 'published' ? '📥 Unpublish' : '🚀 Publish'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(post.id)}>🗑</button>
          </div>
        </div>
      ))}

      {/* Edit/Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Post' : 'New Post'}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳' : 'Save'}</button>
          </>
        }
      >
        {/* Tab nav */}
        <div className="pills" style={{ marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t} className={`pill ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'content' ? '📄 Content' : t === 'seo' ? '🔍 SEO' : '📱 Social'}
            </button>
          ))}
        </div>

        {activeTab === 'content' && (
          <>
            <FormGroup label="Title">
              <input className="inp" placeholder="Post title" value={form.title} onChange={setF('title')} autoFocus />
            </FormGroup>
            <FormGroup label="Slug">
              <input className="inp" placeholder="url-slug" value={form.slug} onChange={setF('slug')} style={{ fontFamily: 'monospace', fontSize: 13 }} />
            </FormGroup>
            <FormGroup label="Description">
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <AiBtn type="improve_desc" label="Improve" />
              </div>
              <textarea className="inp" placeholder="Short description…" value={form.description}
                onChange={setF('description')} rows={3} />
            </FormGroup>
            <FormGroup label="Content (HTML / Markdown)">
              <textarea className="inp" placeholder="Write your post…" value={form.content}
                onChange={setF('content')} rows={10} style={{ fontFamily: 'monospace', fontSize: 13 }} />
            </FormGroup>
            <FormGroup label="Tags (comma separated)">
              <input className="inp" placeholder="react, vite, web" value={tagsInput}
                onChange={e => setTagsInput(e.target.value)} />
            </FormGroup>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormGroup label="Status">
                <select className="inp" value={form.status} onChange={setF('status')}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </FormGroup>
              <FormGroup label="Publish Date">
                <input className="inp" type="date" value={form.publishDate} onChange={setF('publishDate')} />
              </FormGroup>
            </div>
            <FormGroup label="Featured Image URL">
              <input className="inp" placeholder="https://…" value={form.featuredImage} onChange={setF('featuredImage')} />
            </FormGroup>
          </>
        )}

        {activeTab === 'seo' && (
          <>
            <FormGroup label="SEO Title">
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <AiBtn type="seo_title" label="Generate" />
              </div>
              <input className="inp" placeholder="SEO title (under 70 chars)" value={form.seoTitle} onChange={setF('seoTitle')} />
              <div style={{ fontSize: 11, color: form.seoTitle?.length > 70 ? 'var(--acc3)' : 'var(--txt3)', marginTop: 4 }}>
                {form.seoTitle?.length || 0}/70
              </div>
            </FormGroup>
            <FormGroup label="SEO Description">
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <AiBtn type="seo_desc" label="Generate" />
              </div>
              <textarea className="inp" placeholder="Meta description (under 155 chars)" value={form.seoDescription}
                onChange={setF('seoDescription')} rows={3} />
              <div style={{ fontSize: 11, color: form.seoDescription?.length > 155 ? 'var(--acc3)' : 'var(--txt3)', marginTop: 4 }}>
                {form.seoDescription?.length || 0}/155
              </div>
            </FormGroup>
            <FormGroup label="SEO Keywords">
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <AiBtn type="keywords" label="Extract" />
              </div>
              <input className="inp" placeholder="keyword1, keyword2…" value={form.seoKeywords} onChange={setF('seoKeywords')} />
            </FormGroup>
            <FormGroup label="Canonical URL">
              <input className="inp" placeholder="https://…" value={form.canonical} onChange={setF('canonical')} />
            </FormGroup>
            <FormGroup label="OG Image URL">
              <input className="inp" placeholder="https://…" value={form.ogImage} onChange={setF('ogImage')} />
            </FormGroup>
          </>
        )}

        {activeTab === 'social' && (
          <>
            <FormGroup label="X (Twitter) post">
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <AiBtn type="share_x" label="Generate" />
              </div>
              <textarea className="inp" placeholder="Share text for X…" value={form.shareTextX}
                onChange={setF('shareTextX')} rows={3} />
            </FormGroup>
            <FormGroup label="LinkedIn post">
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <AiBtn type="share_linkedin" label="Generate" />
              </div>
              <textarea className="inp" placeholder="Share text for LinkedIn…" value={form.shareTextLinkedin}
                onChange={setF('shareTextLinkedin')} rows={3} />
            </FormGroup>
            <FormGroup label="Instagram caption">
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <AiBtn type="share_instagram" label="Generate" />
              </div>
              <textarea className="inp" placeholder="Caption + hashtags…" value={form.shareTextInstagram}
                onChange={setF('shareTextInstagram')} rows={4} />
            </FormGroup>
          </>
        )}
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => doDelete(deleteId)} message="Delete this post permanently?" />
    </div>
  )
}
