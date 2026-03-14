// ═══════════════════════════════════════════════════════
//  RAM.OS — Ramai AI Page (v3 — DB Memory + Tool Use)
//  File: src/pages/AI.jsx
// ═══════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react'
import { PageHeader, Spinner } from '../components/UI'
import { useApp } from '../lib/context'
import {
  lsGet, lsSet,
  fetchItems, fetchBlogs, createBlog, createItem, slugify,
  fetchAiHistory, saveAiMessage, fetchAiMemory, updateAiMemory, clearAiHistory,
  aiOptimize,
} from '../lib/api'

// ── QUICK PROMPTS ──────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: '✍️', label: 'Write & post a blog',       text: 'Write a complete blog post for me on an interesting topic and post it to my blog. Use write_and_post_blog.' },
  { icon: '📋', label: 'Summarise my tasks today',  text: 'Fetch my tasks with get_tasks and give me a prioritised action plan for today.' },
  { icon: '📓', label: 'Review my recent notes',    text: 'Fetch my notes with get_notes and summarise key themes and action items.' },
  { icon: '🔥', label: 'Check habit progress',      text: 'Fetch my habits with get_habits and tell me how I am tracking.' },
  { icon: '💡', label: 'Organise my ideas',         text: 'Fetch my ideas with get_ideas and help me organise and prioritise them.' },
  { icon: '📅', label: 'Plan my week',              text: 'Look at my tasks and habits and help me plan an effective and balanced week.' },
]

// ── PROVIDERS ─────────────────────────────────────────
const AI_PROVIDERS = {
  claude: { label: 'Claude', icon: '🧠', models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001', 'claude-opus-4-6'], color: '#d97706' },
  groq:   { label: 'Groq',   icon: '⚡', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'], color: '#16a34a' },
  gemini: { label: 'Gemini', icon: '✨', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'], color: '#2563eb' },
}

// ── TOOL DEFINITIONS (Claude tool_use schema) ──────────
const TOOLS = [
  { name: 'get_tasks',   description: 'Fetch all tasks from the user\'s task list.',   input_schema: { type: 'object', properties: {}, required: [] } },
  { name: 'get_notes',   description: 'Fetch all notes the user has saved.',           input_schema: { type: 'object', properties: {}, required: [] } },
  { name: 'get_habits',  description: 'Fetch all habits the user is tracking.',        input_schema: { type: 'object', properties: {}, required: [] } },
  { name: 'get_ideas',   description: 'Fetch all ideas the user has captured.',        input_schema: { type: 'object', properties: {}, required: [] } },
  { name: 'get_blogs',   description: 'Fetch all blog posts.',                         input_schema: { type: 'object', properties: {}, required: [] } },
  {
    name: 'create_task', description: 'Create a new task for the user.',
    input_schema: { type: 'object', properties: {
      title:    { type: 'string' },
      priority: { type: 'string', enum: ['low','medium','high','urgent'] },
      dueDate:  { type: 'string', description: 'YYYY-MM-DD' },
      notes:    { type: 'string' },
    }, required: ['title'] },
  },
  {
    name: 'create_note', description: 'Create a new note.',
    input_schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } }, required: ['title','content'] },
  },
  {
    name: 'create_idea', description: 'Save a new idea.',
    input_schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } }, required: ['title'] },
  },
  {
    name: 'write_and_post_blog',
    description: 'Write a complete, well-structured blog post on a topic and post it to the user\'s blog. Handles generation of all content, SEO fields, social copy, and publishing.',
    input_schema: { type: 'object', properties: {
      topic:  { type: 'string', description: 'Topic or theme for the blog post' },
      status: { type: 'string', enum: ['draft','published'], description: 'Post immediately as published, or save as draft' },
    }, required: ['topic'] },
  },
]

// ── TOOL EXECUTOR ──────────────────────────────────────
async function executeTool(name, args, model) {
  try {
    if (name === 'get_tasks')  return await fetchItems('tasks')
    if (name === 'get_notes')  return await fetchItems('notes')
    if (name === 'get_habits') return await fetchItems('habits')
    if (name === 'get_ideas')  return await fetchItems('ideas')
    if (name === 'get_blogs')  return await fetchBlogs()
    if (name === 'create_task') return await createItem('tasks', { priority: 'medium', done: false, subtasks: [], tags: '', recurrence: 'none', ...args })
    if (name === 'create_note') return await createItem('notes', { color: '', ...args })
    if (name === 'create_idea') return await createItem('ideas', { content: '', ...args })

    if (name === 'write_and_post_blog') {
      const claudeKey = localStorage.getItem('ramos_claude_key') || ''
      const headers   = { 'Content-Type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' }
      if (claudeKey) headers['x-api-key'] = claudeKey

      const prompt = `Write a complete, engaging blog post about: "${args.topic}".

Return ONLY a valid JSON object (no markdown, no backticks) with exactly these fields:
{
  "title": "compelling blog title",
  "description": "2-3 sentence excerpt used in post previews",
  "content": "full HTML post body using <h2>, <p>, <ul>, <li>, <strong>, <em> tags — minimum 500 words",
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "SEO title under 70 characters",
  "seoDescription": "meta description under 155 characters",
  "seoKeywords": "keyword1, keyword2, keyword3, keyword4",
  "shareTextX": "engaging tweet under 280 chars with 2-3 relevant hashtags",
  "shareTextLinkedin": "professional LinkedIn post of 2-3 paragraphs"
}`

      const genRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers,
        body: JSON.stringify({
          model,
          max_tokens: 6000,
          system: 'You are a professional blog writer. Return only valid JSON with no markdown fences.',
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const genData = await genRes.json()
      if (genData.error) throw new Error(genData.error.message)
      const rawText = genData.content?.[0]?.text || '{}'
      let post
      try { post = JSON.parse(rawText.replace(/```json|```/g, '').trim()) }
      catch { post = { title: `Blog: ${args.topic}`, description: args.topic, content: `<p>${rawText}</p>`, tags: [] } }

      const slug    = slugify(post.title)
      const payload = {
        title: post.title, slug, content: post.content, description: post.description,
        tags: post.tags || [], status: args.status || 'draft',
        seoTitle: post.seoTitle || post.title, seoDescription: post.seoDescription || post.description,
        seoKeywords: post.seoKeywords || '', shareTextX: post.shareTextX || '',
        shareTextLinkedin: post.shareTextLinkedin || '', shareTextInstagram: '',
        ogTitle: post.title, ogImage: '', canonical: '', featuredImage: '',
        publishDate: new Date().toISOString().split('T')[0],
      }
      const result = await createBlog(payload)
      return {
        success: true, id: result.id, title: post.title, slug,
        status: payload.status, description: post.description, tags: payload.tags,
        wordCount: post.content.replace(/<[^>]+>/g, '').split(/\s+/).length,
        seoTitle: payload.seoTitle,
      }
    }

    return { error: 'Unknown tool: ' + name }
  } catch (e) { return { error: e.message } }
}

// ── MEMORY UPDATE (called after each conversation turn) ─
// Asks Claude to compress the conversation into an updated memory summary
async function refreshMemory(currentSummary, recentMessages, model) {
  try {
    const claudeKey = localStorage.getItem('ramos_claude_key') || ''
    const headers   = { 'Content-Type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' }
    if (claudeKey) headers['x-api-key'] = claudeKey

    const last5 = recentMessages.slice(-10).map(m => `${m.role.toUpperCase()}: ${typeof m.content === 'string' ? m.content.slice(0, 300) : '[tool]'}`).join('\n')

    const prompt = `You maintain a memory summary for an AI assistant called Ramai inside Ram.OS.

CURRENT MEMORY SUMMARY:
${currentSummary.slice(0, 3000)}

RECENT CONVERSATION:
${last5}

Update the memory summary to incorporate any new information learned about the user (preferences, goals, habits, patterns, important context). Keep the RAM.OS system knowledge section intact. Keep the total summary under 4000 characters. Return only the updated summary text, no preamble.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers,
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        system: 'You are a memory manager. Return only the updated memory summary text.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    if (data.error) return null
    const newSummary = data.content?.[0]?.text || ''
    if (newSummary) await updateAiMemory(newSummary)
    return newSummary
  } catch { return null }
}

// ── SYSTEM PROMPT BUILDER ─────────────────────────────
function buildSystemPrompt(memory) {
  return `You are Ramai, a personal AI assistant built into Ram.OS — a personal life operating system.

You have FULL access to the user's data: tasks, notes, habits, ideas, and blog. Use tools proactively when the user asks about their data or wants something done.

MEMORY & CONTEXT:
${memory || 'No memory loaded yet.'}

BLOG WRITING:
When asked to write/post a blog, call write_and_post_blog with a relevant topic. After it completes, tell the user the title, slug, word count, and status.

BEHAVIOUR:
- Use tools before answering questions that require real data
- When fetching data, give insights and actionable advice — not raw dumps
- Be concise, warm, and practical
- Remember user preferences and context from the memory above`
}

// ─────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function AI() {
  const { showToast } = useApp()

  const [messages,      setMessages]      = useState([])
  const [memory,        setMemory]        = useState('')
  const [input,         setInput]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [initialLoad,   setInitialLoad]   = useState(true)
  const [showSettings,  setShowSettings]  = useState(false)
  const [toolActivity,  setToolActivity]  = useState([])
  const [memoryUpdating, setMemoryUpdating] = useState(false)

  const [provider, setProvider] = useState(() => lsGet('ai_provider', 'claude'))
  const [model,    setModel]    = useState(() => {
    const p = lsGet('ai_provider', 'claude')
    return lsGet('ai_model', AI_PROVIDERS[p]?.models[0] || 'claude-sonnet-4-20250514')
  })
  const [keys, setKeys] = useState({
    claude: localStorage.getItem('ramos_claude_key') || '',
    groq:   localStorage.getItem('ramos_groq_key')   || '',
    gemini: localStorage.getItem('ramos_gemini_key') || '',
  })

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // ── LOAD HISTORY & MEMORY FROM DB ON MOUNT ────────
  useEffect(() => {
    async function loadFromDB() {
      try {
        const { messages: dbMessages, memory: dbMemory } = await fetchAiHistory(60)
        setMessages(dbMessages || [])
        setMemory(dbMemory || '')
      } catch {
        // Fall back to localStorage if DB unavailable
        setMessages(lsGet('ai_chat', []))
      } finally {
        setInitialLoad(false)
      }
    }
    loadFromDB()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, toolActivity])

  function saveSettings() {
    localStorage.setItem('ramos_claude_key', keys.claude)
    localStorage.setItem('ramos_groq_key',   keys.groq)
    localStorage.setItem('ramos_gemini_key', keys.gemini)
    lsSet('ai_provider', provider)
    lsSet('ai_model', model)
    setShowSettings(false)
    showToast('AI settings saved', 'success')
  }

  function changeProvider(p) { setProvider(p); setModel(AI_PROVIDERS[p].models[0]) }

  // ── PERSIST a message pair to DB ─────────────────
  async function persistMessages(userText, assistantText) {
    try {
      await saveAiMessage('user', userText)
      await saveAiMessage('assistant', assistantText)
    } catch { /* silent — DB might not be deployed yet */ }
  }

  // ── MAIN SEND ────────────────────────────────────
  async function send(text) {
    const userMsg = text || input.trim()
    if (!userMsg || loading) return
    setInput('')
    setToolActivity([])

    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    let finalAssistantText = ''

    try {
      if (provider !== 'claude') {
        const key = provider === 'groq'
          ? localStorage.getItem('ramos_groq_key')
          : localStorage.getItem('ramos_gemini_key')
        if (!key) throw new Error(`${AI_PROVIDERS[provider].label} API key not set in ⚙️ Settings`)

        let reply = ''
        const sysPrompt = buildSystemPrompt(memory)

        if (provider === 'groq') {
          const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
            body: JSON.stringify({
              model, max_tokens: 2000,
              messages: [
                { role: 'system', content: sysPrompt },
                ...newMessages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) })),
              ],
            }),
          })
          const d = await r.json()
          if (d.error) throw new Error(d.error.message)
          reply = d.choices?.[0]?.message?.content || 'No response.'
        } else {
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: sysPrompt }] },
              contents: newMessages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }] })),
              generationConfig: { maxOutputTokens: 2000 },
            }),
          })
          const d = await r.json()
          if (d.error) throw new Error(d.error.message)
          reply = d.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.'
        }

        finalAssistantText = reply
        setMessages(p => [...p, { role: 'assistant', content: reply }])

      } else {
        // ── Claude: agentic tool loop ──────────────
        const claudeKey = localStorage.getItem('ramos_claude_key') || ''
        const headers   = { 'Content-Type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' }
        if (claudeKey) headers['x-api-key'] = claudeKey

        const sysPrompt = buildSystemPrompt(memory)
        let currentMessages = newMessages
        let iterations = 0

        while (iterations < 10) {
          iterations++
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST', headers,
            body: JSON.stringify({
              model, max_tokens: 4000, system: sysPrompt, tools: TOOLS,
              messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
            }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error.message)

          const content   = data.content || []
          const textBlocks = content.filter(b => b.type === 'text')
          const toolBlocks = content.filter(b => b.type === 'tool_use')

          if (textBlocks.length > 0) {
            const txt = textBlocks.map(b => b.text).join('\n')
            finalAssistantText = txt
            setMessages(p => {
              const last = p[p.length - 1]
              if (last?.role === 'assistant' && last?.__stream) return [...p.slice(0, -1), { role: 'assistant', content: txt, __stream: true }]
              return [...p, { role: 'assistant', content: txt, __stream: true }]
            })
          }

          if (toolBlocks.length === 0 || data.stop_reason === 'end_turn') {
            setMessages(p => {
              const last = p[p.length - 1]
              if (last?.__stream) return [...p.slice(0, -1), { role: 'assistant', content: last.content }]
              return p
            })
            break
          }

          currentMessages = [...currentMessages, { role: 'assistant', content }]
          const toolResults = []

          for (const tool of toolBlocks) {
            setToolActivity(prev => [...prev, { name: tool.name, status: '⏳' }])
            const result    = await executeTool(tool.name, tool.input || {}, model)
            const isError   = !!result?.error
            setToolActivity(prev => prev.map((t, i) => i === prev.length - 1 ? { ...t, status: isError ? '❌' : '✅' } : t))
            toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: JSON.stringify(result) })
          }

          currentMessages = [...currentMessages, { role: 'user', content: toolResults }]
        }
      }

      // ── Persist to DB ──────────────────────────
      if (finalAssistantText) {
        await persistMessages(userMsg, finalAssistantText)
        // Every 5 messages, refresh the memory summary in the background
        if (provider === 'claude' && newMessages.length % 5 === 0) {
          setMemoryUpdating(true)
          const updated = await refreshMemory(memory, newMessages, model)
          if (updated) setMemory(updated)
          setMemoryUpdating(false)
        }
      }

    } catch (e) {
      showToast('AI error: ' + e.message, 'error')
      setMessages(p => [...p, { role: 'assistant', content: `⚠️ ${e.message}` }])
    } finally {
      setLoading(false)
      setToolActivity([])
      inputRef.current?.focus()
    }
  }

  async function doClearChat() {
    try { await clearAiHistory() } catch {}
    setMessages([])
    lsSet('ai_chat', [])
    setToolActivity([])
    showToast('Chat cleared', 'success')
  }

  const prov = AI_PROVIDERS[provider]

  if (initialLoad) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      <PageHeader
        title="Ramai AI 🤖"
        subtitle={
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: prov.color, fontWeight: 600, fontSize: 12 }}>{prov.icon} {prov.label} · {model}</span>
            {memoryUpdating && <span style={{ fontSize: 10, color: 'var(--txt3)' }}>· updating memory…</span>}
            {memory && !memoryUpdating && <span style={{ fontSize: 10, color: 'var(--txt3)' }}>· 🧠 memory active</span>}
          </span>
        }
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(s => !s)} title="AI Settings">⚙️</button>
            {messages.length > 0 && <button className="btn btn-ghost btn-sm" onClick={doClearChat} title="Clear chat">🗑</button>}
          </div>
        }
      />

      {/* ── SETTINGS ─────────────────────────────── */}
      {showSettings && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>⚙️ AI Provider Settings</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 8 }}>Provider</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(AI_PROVIDERS).map(([id, p]) => (
                <button key={id} onClick={() => changeProvider(id)}
                  style={{ flex: 1, padding: '8px 6px', borderRadius: 10, border: `2px solid ${provider === id ? p.color : 'var(--bdr)'}`, background: provider === id ? p.color + '22' : 'var(--bg3)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: provider === id ? p.color : 'var(--txt2)', textAlign: 'center' }}>
                  {p.icon}<br />{p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Model</div>
            <select className="inp" value={model} onChange={e => setModel(e.target.value)} style={{ fontSize: 13 }}>
              {AI_PROVIDERS[provider].models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {Object.entries(AI_PROVIDERS).map(([id, p]) => (
            <div key={id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>
                {p.icon} {p.label} API Key
                {id === 'claude' && <span style={{ fontSize: 11, color: 'var(--txt3)', marginLeft: 6 }}>(optional — uses proxy if blank)</span>}
              </div>
              <input className="inp" type="password" placeholder={`${p.label} key…`}
                value={keys[id]} onChange={e => setKeys(k => ({ ...k, [id]: e.target.value }))}
                style={{ fontSize: 13, fontFamily: 'monospace' }} />
            </div>
          ))}

          {memory && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>🧠 Memory Preview</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', background: 'var(--bg3)', padding: '10px 12px', borderRadius: 10, lineHeight: 1.6, maxHeight: 120, overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {memory.slice(0, 600)}{memory.length > 600 ? '…' : ''}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={saveSettings}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(false)}>Cancel</button>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--txt3)', lineHeight: 1.8 }}>
            🔒 Keys stored locally only<br />
            🧠 Conversation saved to DB · memory auto-updates every 5 messages<br />
            💡 Tool use (blog, tasks, notes) requires Claude
          </div>
        </div>
      )}

      {/* ── WELCOME ──────────────────────────────── */}
      {messages.length === 0 && !showSettings && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ padding: 16, background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 14, fontSize: 13, color: 'var(--txt2)', lineHeight: 1.7, marginBottom: 16 }}>
            <strong style={{ color: 'var(--txt)', fontSize: 15 }}>Hi! I'm Ramai 👋</strong><br />
            I know Ram.OS inside out — and I remember our past conversations{memory ? ' 🧠' : ''}. I can access your tasks, notes, habits, ideas, and <strong style={{ color: prov.color }}>write & post blogs</strong> automatically.
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--txt3)', marginBottom: 10 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_PROMPTS.map(p => (
              <button key={p.label} className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', textAlign: 'left', gap: 12, padding: '13px 14px' }}
                onClick={() => send(p.text)}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <span style={{ fontSize: 13 }}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── CHAT MESSAGES ────────────────────────── */}
      <div className="ai-messages" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`ai-msg ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="ai-avatar" style={{ background: prov.color + '33', borderColor: prov.color }}>{prov.icon}</div>
            )}
            <div className="ai-bubble" style={{ whiteSpace: 'pre-wrap' }}>
              {typeof msg.content === 'string' ? msg.content : '…'}
            </div>
            {msg.role === 'user' && (
              <div className="ai-avatar" style={{ background: 'var(--acc)', border: 'none' }}>👤</div>
            )}
          </div>
        ))}

        {/* Tool activity feed */}
        {loading && toolActivity.length > 0 && (
          <div style={{ paddingLeft: 48, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {toolActivity.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--txt2)', background: 'var(--bg2)', borderRadius: 8, padding: '6px 10px', border: '1px solid var(--bdr)', width: 'fit-content' }}>
                <span style={{ fontFamily: 'monospace', color: 'var(--acc3)', fontSize: 11 }}>{t.name}</span>
                <span>{t.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* Typing dots */}
        {loading && toolActivity.length === 0 && (
          <div className="ai-msg assistant">
            <div className="ai-avatar" style={{ background: prov.color + '33', borderColor: prov.color }}>{prov.icon}</div>
            <div className="ai-bubble">
              <span style={{ display: 'inline-flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--txt2)', animation: `bounce .8s ${i * .15}s infinite` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ────────────────────────────────── */}
      <div className="ai-input-row">
        <input
          ref={inputRef}
          className="inp flex-1"
          placeholder="Write a blog, check tasks, add a note…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>
          {loading ? '⏳' : '→'}
        </button>
      </div>

      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  )
}
