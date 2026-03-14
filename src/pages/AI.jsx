// ═══════════════════════════════════════════════════════
//  RAM.OS — Ramai AI Page (Enhanced)
//  File: src/pages/AI.jsx
//  Features: Multi-provider, Blog Writer+Post, All Module Access, Tool Use
// ═══════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react'
import { PageHeader } from '../components/UI'
import { useApp } from '../lib/context'
import { lsGet, lsSet, fetchItems, fetchBlogs, createBlog, createItem, slugify } from '../lib/api'

const QUICK_PROMPTS = [
  { icon: '✍️', label: 'Write & post a blog for me',  text: "Write a complete blog post for me on a topic of your choice and post it to my blog using the write_and_post_blog tool." },
  { icon: '📋', label: 'Summarise my tasks today',    text: "Fetch my tasks with get_tasks and give me a prioritised action plan for today." },
  { icon: '📓', label: 'Review my recent notes',      text: "Fetch my notes with get_notes and summarise key themes and action items." },
  { icon: '🔥', label: 'Check my habits progress',    text: "Fetch my habits with get_habits and tell me how I'm tracking." },
  { icon: '💡', label: 'Organise my ideas',           text: "Fetch my ideas with get_ideas and help me organise and prioritise them." },
  { icon: '📅', label: 'Plan my week',                text: "Look at my tasks and habits and help me plan an effective week." },
]

const AI_PROVIDERS = {
  claude: { label: 'Claude', icon: '🧠', models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001', 'claude-opus-4-6'], color: '#d97706' },
  groq:   { label: 'Groq',   icon: '⚡', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'], color: '#16a34a' },
  gemini: { label: 'Gemini', icon: '✨', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'], color: '#2563eb' },
}

const TOOLS = [
  { name: 'get_tasks',   description: "Fetch all user tasks",   input_schema: { type: 'object', properties: {}, required: [] } },
  { name: 'get_notes',   description: "Fetch all user notes",   input_schema: { type: 'object', properties: {}, required: [] } },
  { name: 'get_habits',  description: "Fetch all user habits",  input_schema: { type: 'object', properties: {}, required: [] } },
  { name: 'get_ideas',   description: "Fetch all user ideas",   input_schema: { type: 'object', properties: {}, required: [] } },
  { name: 'get_blogs',   description: "Fetch all blog posts",   input_schema: { type: 'object', properties: {}, required: [] } },
  {
    name: 'create_task', description: "Create a new task",
    input_schema: { type: 'object', properties: { title: { type: 'string' }, priority: { type: 'string', enum: ['low','medium','high','urgent'] }, dueDate: { type: 'string' }, notes: { type: 'string' } }, required: ['title'] }
  },
  {
    name: 'create_note', description: "Create a new note",
    input_schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } }, required: ['title', 'content'] }
  },
  {
    name: 'create_idea', description: "Save a new idea",
    input_schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } }, required: ['title'] }
  },
  {
    name: 'write_and_post_blog',
    description: "Write a complete blog post on a topic and post it to the user's blog. The AI will generate the full content, SEO fields, and social media copy before posting.",
    input_schema: { type: 'object', properties: { topic: { type: 'string', description: 'Blog post topic or theme' }, status: { type: 'string', enum: ['draft','published'], description: 'Post as draft or publish immediately' } }, required: ['topic'] }
  },
  {
    name: 'post_blog',
    description: "Post a fully written blog to the blog system",
    input_schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, description: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, status: { type: 'string', enum: ['draft','published'] }, seoTitle: { type: 'string' }, seoDescription: { type: 'string' }, seoKeywords: { type: 'string' }, shareTextX: { type: 'string' }, shareTextLinkedin: { type: 'string' } }, required: ['title','content','description'] }
  },
]

const SYSTEM_PROMPT = `You are Ramai, a personal AI assistant built into Ram.OS — a personal life operating system.

You have FULL access to the user's modules: tasks, notes, habits, ideas, and blog. Use tools proactively when users ask about their data.

BLOG WRITING: When asked to write/post a blog, call write_and_post_blog with a relevant topic. The system will handle generating and posting the full post. After posting, summarise what was posted.

GENERAL: Be concise, practical, and proactive. When fetching data, give insights not just raw lists. Use tools before answering questions about user data.`

async function executeTool(name, args, model, showToast) {
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
      // Generate full blog post via AI
      const key = localStorage.getItem('ramos_claude_key') || ''
      const headers = { 'Content-Type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' }
      if (key) headers['x-api-key'] = key

      const blogPrompt = `Write a complete engaging blog post about: "${args.topic}".
Return ONLY valid JSON (no markdown fences) with these fields:
{"title":"string","description":"2-3 sentence excerpt","content":"HTML using h2,p,ul,li,strong tags","tags":["tag1","tag2","tag3"],"seoTitle":"under 70 chars","seoDescription":"under 155 chars","seoKeywords":"kw1, kw2, kw3","shareTextX":"tweet under 280 chars with hashtags","shareTextLinkedin":"professional 2-3 paragraph LinkedIn post"}`

      const genRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers,
        body: JSON.stringify({ model, max_tokens: 4000, system: 'Return only valid JSON, no markdown.', messages: [{ role: 'user', content: blogPrompt }] })
      })
      const genData = await genRes.json()
      if (genData.error) throw new Error(genData.error.message)
      const rawText = genData.content?.[0]?.text || '{}'
      let blogPost
      try { blogPost = JSON.parse(rawText.replace(/```json|```/g, '').trim()) }
      catch { blogPost = { title: `Blog: ${args.topic}`, description: args.topic, content: `<p>${rawText}</p>`, tags: [] } }

      // Now post it
      const slug = slugify(blogPost.title)
      const payload = {
        title: blogPost.title, slug, content: blogPost.content, description: blogPost.description,
        tags: blogPost.tags || [], status: args.status || 'draft',
        seoTitle: blogPost.seoTitle || blogPost.title, seoDescription: blogPost.seoDescription || blogPost.description,
        seoKeywords: blogPost.seoKeywords || '', shareTextX: blogPost.shareTextX || '',
        shareTextLinkedin: blogPost.shareTextLinkedin || '', shareTextInstagram: '',
        ogTitle: blogPost.title, ogImage: '', canonical: '', featuredImage: '',
        publishDate: new Date().toISOString().split('T')[0],
      }
      const result = await createBlog(payload)
      return { success: true, id: result.id, title: blogPost.title, slug, status: payload.status, description: blogPost.description, tags: payload.tags }
    }

    if (name === 'post_blog') {
      const slug = slugify(args.title)
      const payload = { title: args.title, slug, content: args.content, description: args.description, tags: args.tags || [], status: args.status || 'draft', seoTitle: args.seoTitle || args.title, seoDescription: args.seoDescription || args.description, seoKeywords: args.seoKeywords || '', shareTextX: args.shareTextX || '', shareTextLinkedin: args.shareTextLinkedin || '', shareTextInstagram: '', ogTitle: args.title, ogImage: '', canonical: '', featuredImage: '', publishDate: new Date().toISOString().split('T')[0] }
      const result = await createBlog(payload)
      return { success: true, id: result.id, slug, status: payload.status, title: args.title }
    }

    return { error: 'Unknown tool: ' + name }
  } catch (e) { return { error: e.message } }
}

export default function AI() {
  const { showToast } = useApp()
  const [messages, setMessages]     = useState(() => lsGet('ai_chat', []))
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [provider, setProvider]     = useState(() => lsGet('ai_provider', 'claude'))
  const [model, setModel]           = useState(() => { const p = lsGet('ai_provider', 'claude'); return lsGet('ai_model', AI_PROVIDERS[p]?.models[0] || 'claude-sonnet-4-20250514') })
  const [keys, setKeys] = useState({ claude: localStorage.getItem('ramos_claude_key') || '', groq: localStorage.getItem('ramos_groq_key') || '', gemini: localStorage.getItem('ramos_gemini_key') || '' })
  const [toolActivity, setToolActivity] = useState([])
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading, toolActivity])
  useEffect(() => { lsSet('ai_chat', messages.slice(-60)) }, [messages])

  function saveSettings() {
    localStorage.setItem('ramos_claude_key', keys.claude)
    localStorage.setItem('ramos_groq_key',   keys.groq)
    localStorage.setItem('ramos_gemini_key', keys.gemini)
    lsSet('ai_provider', provider); lsSet('ai_model', model)
    setShowSettings(false); showToast('AI settings saved', 'success')
  }

  function changeProvider(p) { setProvider(p); setModel(AI_PROVIDERS[p].models[0]) }

  async function send(text) {
    const userMsg = text || input.trim()
    if (!userMsg || loading) return
    setInput(''); setToolActivity([])

    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages); setLoading(true)

    try {
      if (provider !== 'claude') {
        const key = provider === 'groq' ? localStorage.getItem('ramos_groq_key') : localStorage.getItem('ramos_gemini_key')
        if (!key) throw new Error(`${AI_PROVIDERS[provider].label} API key not set in ⚙️ Settings`)
        let reply
        if (provider === 'groq') {
          const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`}, body: JSON.stringify({ model, max_tokens:2000, messages:[{role:'system',content:SYSTEM_PROMPT},...newMessages.map(m=>({role:m.role,content:typeof m.content==='string'?m.content:JSON.stringify(m.content)}))] }) })
          const d = await r.json(); if(d.error) throw new Error(d.error.message); reply = d.choices?.[0]?.message?.content || 'No response.'
        } else {
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ system_instruction:{parts:[{text:SYSTEM_PROMPT}]}, contents:newMessages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:typeof m.content==='string'?m.content:JSON.stringify(m.content)}]})), generationConfig:{maxOutputTokens:2000} }) })
          const d = await r.json(); if(d.error) throw new Error(d.error.message); reply = d.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.'
        }
        setMessages(p => [...p, { role:'assistant', content: reply }]); return
      }

      // Claude: agentic tool loop
      const claudeKey = localStorage.getItem('ramos_claude_key') || ''
      const headers = { 'Content-Type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' }
      if (claudeKey) headers['x-api-key'] = claudeKey

      let currentMessages = newMessages
      let iterations = 0

      while (iterations < 10) {
        iterations++
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', headers,
          body: JSON.stringify({ model, max_tokens: 4000, system: SYSTEM_PROMPT, tools: TOOLS, messages: currentMessages.map(m => ({ role: m.role, content: m.content })) })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error.message)

        const content = data.content || []
        const textBlocks = content.filter(b => b.type === 'text')
        const toolBlocks = content.filter(b => b.type === 'tool_use')

        if (textBlocks.length > 0) {
          const txt = textBlocks.map(b => b.text).join('\n')
          setMessages(p => {
            const last = p[p.length - 1]
            if (last?.role === 'assistant' && last?.__stream) return [...p.slice(0,-1), { role:'assistant', content: txt, __stream: true }]
            return [...p, { role:'assistant', content: txt, __stream: true }]
          })
        }

        if (toolBlocks.length === 0 || data.stop_reason === 'end_turn') {
          setMessages(p => { const last = p[p.length-1]; if(last?.__stream) return [...p.slice(0,-1),{role:'assistant',content:last.content}]; return p })
          break
        }

        currentMessages = [...currentMessages, { role: 'assistant', content }]
        const toolResults = []

        for (const tool of toolBlocks) {
          setToolActivity(prev => [...prev, { name: tool.name, status: '⏳ running' }])
          const result = await executeTool(tool.name, tool.input || {}, model, showToast)
          const isError = result?.error
          setToolActivity(prev => prev.map((t, i) => i === prev.length - 1 ? { ...t, status: isError ? '❌ error' : '✅ done' } : t))
          toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: JSON.stringify(result) })
        }

        currentMessages = [...currentMessages, { role: 'user', content: toolResults }]
      }
    } catch (e) {
      showToast('AI error: ' + e.message, 'error')
      setMessages(p => [...p, { role:'assistant', content: `⚠️ ${e.message}` }])
    } finally { setLoading(false); setToolActivity([]); inputRef.current?.focus() }
  }

  function clearChat() { setMessages([]); lsSet('ai_chat', []); setToolActivity([]) }
  const prov = AI_PROVIDERS[provider]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <PageHeader
        title="Ramai AI 🤖"
        subtitle={<span style={{ color: prov.color, fontWeight:600, fontSize:12 }}>{prov.icon} {prov.label} · {model}</span>}
        actions={
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(s => !s)}>⚙️</button>
            {messages.length > 0 && <button className="btn btn-ghost btn-sm" onClick={clearChat}>🗑</button>}
          </div>
        }
      />

      {showSettings && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:14, padding:16, marginBottom:16 }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>⚙️ AI Provider Settings</div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'var(--txt2)', marginBottom:8 }}>Provider</div>
            <div style={{ display:'flex', gap:8 }}>
              {Object.entries(AI_PROVIDERS).map(([id, p]) => (
                <button key={id} onClick={() => changeProvider(id)}
                  style={{ flex:1, padding:'8px 6px', borderRadius:10, border:`2px solid ${provider===id?p.color:'var(--bdr)'}`, background:provider===id?p.color+'22':'var(--bg3)', cursor:'pointer', fontSize:12, fontWeight:600, color:provider===id?p.color:'var(--txt2)', textAlign:'center' }}>
                  {p.icon}<br/>{p.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'var(--txt2)', marginBottom:6 }}>Model</div>
            <select className="inp" value={model} onChange={e => setModel(e.target.value)} style={{ fontSize:13 }}>
              {AI_PROVIDERS[provider].models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {Object.entries(AI_PROVIDERS).map(([id, p]) => (
            <div key={id} style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, color:'var(--txt2)', marginBottom:6 }}>
                {p.icon} {p.label} API Key
                {id === 'claude' && <span style={{ fontSize:11, color:'var(--txt3)', marginLeft:6 }}>(optional)</span>}
              </div>
              <input className="inp" type="password" placeholder={`${p.label} key…`}
                value={keys[id]} onChange={e => setKeys(k => ({...k,[id]:e.target.value}))}
                style={{ fontSize:13, fontFamily:'monospace' }} />
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button className="btn btn-primary btn-sm" onClick={saveSettings}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(false)}>Cancel</button>
          </div>
          <div style={{ marginTop:12, fontSize:11, color:'var(--txt3)', lineHeight:1.7 }}>
            🔒 Stored locally only · 💡 Tool use (blog, tasks) requires Claude
          </div>
        </div>
      )}

      {messages.length === 0 && !showSettings && (
        <div style={{ marginBottom:16 }}>
          <div style={{ padding:16, background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:14, fontSize:13, color:'var(--txt2)', lineHeight:1.7, marginBottom:16 }}>
            <strong style={{ color:'var(--txt)', fontSize:15 }}>Hi! I'm Ramai 👋</strong><br/>
            I can access all your modules — tasks, notes, habits, ideas — and <strong style={{ color:prov.color }}>write & post blogs</strong> for you automatically. Just ask!
          </div>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--txt3)', marginBottom:10 }}>Quick Actions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {QUICK_PROMPTS.map(p => (
              <button key={p.label} className="btn btn-ghost"
                style={{ justifyContent:'flex-start', textAlign:'left', gap:12, padding:'13px 14px' }}
                onClick={() => send(p.text)}>
                <span style={{ fontSize:20 }}>{p.icon}</span>
                <span style={{ fontSize:13 }}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ai-messages" style={{ flex:1 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`ai-msg ${msg.role}`}>
            {msg.role === 'assistant' && <div className="ai-avatar" style={{ background:prov.color+'33', borderColor:prov.color }}>{prov.icon}</div>}
            <div className="ai-bubble" style={{ whiteSpace:'pre-wrap' }}>{msg.content}</div>
            {msg.role === 'user' && <div className="ai-avatar" style={{ background:'var(--acc)', border:'none' }}>👤</div>}
          </div>
        ))}

        {loading && toolActivity.length > 0 && (
          <div style={{ paddingLeft:48, marginBottom:8 }}>
            {toolActivity.map((t, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, fontSize:12, color:'var(--txt2)', background:'var(--bg2)', borderRadius:8, padding:'6px 10px', border:'1px solid var(--bdr)' }}>
                <span style={{ fontFamily:'monospace', color:'var(--acc3)', fontSize:11 }}>{t.name}</span>
                <span style={{ color:'var(--txt3)' }}>·</span>
                <span>{t.status}</span>
              </div>
            ))}
          </div>
        )}

        {loading && toolActivity.length === 0 && (
          <div className="ai-msg assistant">
            <div className="ai-avatar" style={{ background:prov.color+'33', borderColor:prov.color }}>{prov.icon}</div>
            <div className="ai-bubble">
              <span style={{ display:'inline-flex', gap:4 }}>
                {[0,1,2].map(i => <span key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--txt2)', animation:`bounce .8s ${i*.15}s infinite` }} />)}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ai-input-row">
        <input ref={inputRef} className="inp flex-1"
          placeholder="Write a blog, check tasks, add a note…"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
          disabled={loading} />
        <button className="btn btn-primary" onClick={() => send()} disabled={loading||!input.trim()}>
          {loading ? '⏳' : '→'}
        </button>
      </div>

      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  )
}
