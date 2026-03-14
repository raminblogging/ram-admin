/**
 * Ram.OS — Cloudflare Worker API
 * ──────────────────────────────────────────────────────
 * Deploy: wrangler deploy
 * Secrets: JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
 * Binding: D1 database named "DB"
 *
 * Endpoints:
 *  POST   /api/auth/login
 *  GET    /api/health
 *
 *  GET    /api/admin/blogs
 *  POST   /api/admin/blogs
 *  PUT    /api/admin/blogs/reorder
 *  PUT    /api/admin/blogs/:id
 *  DELETE /api/admin/blogs/:id
 *
 *  GET    /api/admin/messages
 *  PUT    /api/admin/messages/read-all
 *  PUT    /api/admin/messages/:id/read
 *  DELETE /api/admin/messages/:id
 *
 *  GET    /api/admin/subscriptions
 *  PUT    /api/admin/subscriptions/read-all
 *  PUT    /api/admin/subscriptions/:id/read
 *  DELETE /api/admin/subscriptions/:id
 *
 *  POST   /api/admin/ai/optimize
 *
 *  GET    /api/ai/history          — last N ai_messages + memory summary
 *  POST   /api/ai/message          — save a message to ai_messages
 *  GET    /api/ai/memory           — get the memory summary
 *  PUT    /api/ai/memory           — update the memory summary
 *  DELETE /api/ai/history          — clear all ai_messages
 *
 *  GET    /api/personal/tasks
 *  POST   /api/personal/tasks
 *  PUT    /api/personal/tasks/:id
 *  DELETE /api/personal/tasks/:id
 *
 *  GET    /api/personal/notes
 *  POST   /api/personal/notes
 *  PUT    /api/personal/notes/:id
 *  DELETE /api/personal/notes/:id
 *
 *  GET    /api/personal/events
 *  POST   /api/personal/events
 *  PUT    /api/personal/events/:id
 *  DELETE /api/personal/events/:id
 *
 *  GET    /api/personal/categories
 *  POST   /api/personal/categories
 *  PUT    /api/personal/categories/:id
 *  DELETE /api/personal/categories/:id
 *
 *  GET    /api/personal/habits
 *  POST   /api/personal/habits
 *  PUT    /api/personal/habits/:id
 *  DELETE /api/personal/habits/:id
 *
 *  GET    /api/personal/ideas
 *  POST   /api/personal/ideas
 *  PUT    /api/personal/ideas/:id
 *  DELETE /api/personal/ideas/:id
 *
 *  Public (no auth):
 *  POST   /api/contact
 *  POST   /api/subscribe
 */

// ── CORS ──────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age':       '86400',
};

function cors(body = null, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extra },
  });
}
function json(data, status = 200)  { return cors(JSON.stringify(data), status); }
function err(msg, status = 400)    { return json({ error: msg }, status); }
function noauth()                  { return err('Unauthorized', 401); }

// ── JWT (minimal — no external libs needed) ───────────────
function b64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signJWT(payload, secret) {
  const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = b64url(JSON.stringify(payload));
  const data    = `${header}.${body}`;
  const key     = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig     = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64  = b64url(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}

async function verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;
    const data = `${header}.${body}`;
    const key  = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sigBytes = Uint8Array.from(atob(sig.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
    const valid    = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;
    const payload = JSON.parse(atob(body.replace(/-/g,'+').replace(/_/g,'/')));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch { return null; }
}

function getBearer(request) {
  const auth = request.headers.get('Authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

async function requireAuth(request, env) {
  const token   = getBearer(request);
  if (!token) return null;
  const payload = await verifyJWT(token, env.JWT_SECRET);
  return payload;
}

// ── ID generator ──────────────────────────────────────────
function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── MAIN HANDLER ──────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors('', 204);

    const url  = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');

    // ── Public: health ──────────────────────────────────
    if (path === '/api/health') {
      return json({ status: 'ok', time: new Date().toISOString() });
    }

    // ── Public: contact form ────────────────────────────
    if (path === '/api/contact' && request.method === 'POST') {
      return handleContact(request, env);
    }

    // ── Public: newsletter subscribe ────────────────────
    if (path === '/api/subscribe' && request.method === 'POST') {
      return handleSubscribe(request, env);
    }

    // ── Public: blog posts ──────────────────────────────
    if (path === '/api/blogs' && request.method === 'GET') {
      return getPublicBlogs(env);
    }
    if (path.match(/^\/api\/blogs\/([^/]+)$/) && request.method === 'GET') {
      return getPublicBlogBySlug(path.split('/').pop(), env);
    }

    // ── Auth: login ─────────────────────────────────────
    if (path === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }

    // ── Everything below requires auth ──────────────────
    const user = await requireAuth(request, env);
    if (!user) return noauth();

    // ─────────────────────────────────────────────────────
    //  ADMIN ROUTES
    // ─────────────────────────────────────────────────────

    // Blogs
    if (path === '/api/admin/blogs') {
      if (request.method === 'GET')  return getBlogs(env);
      if (request.method === 'POST') return createBlog(request, env);
    }
    if (path === '/api/admin/blogs/reorder' && request.method === 'PUT') return reorderBlogs(request, env);
    if (path.match(/^\/api\/admin\/blogs\/([^/]+)$/)) {
      const id = path.split('/').pop();
      if (request.method === 'PUT')    return updateBlog(id, request, env);
      if (request.method === 'DELETE') return deleteBlog(id, env);
    }

    // Messages
    if (path === '/api/admin/messages' && request.method === 'GET') return getMessages(env);
    if (path === '/api/admin/messages/read-all' && request.method === 'PUT') return markAllMessagesRead(env);
    if (path.match(/^\/api\/admin\/messages\/([^/]+)\/read$/) && request.method === 'PUT') {
      return markMessageRead(path.split('/')[4], env);
    }
    if (path.match(/^\/api\/admin\/messages\/([^/]+)$/) && request.method === 'DELETE') {
      return deleteMessage(path.split('/').pop(), env);
    }

    // Subscriptions
    if (path === '/api/admin/subscriptions' && request.method === 'GET') return getSubscriptions(env);
    if (path === '/api/admin/subscriptions/read-all' && request.method === 'PUT') return markAllSubsRead(env);
    if (path.match(/^\/api\/admin\/subscriptions\/([^/]+)\/read$/) && request.method === 'PUT') {
      return markSubRead(path.split('/')[4], env);
    }
    if (path.match(/^\/api\/admin\/subscriptions\/([^/]+)$/) && request.method === 'DELETE') {
      return deleteSubscription(path.split('/').pop(), env);
    }

    // AI Optimize
    if (path === '/api/admin/ai/optimize' && request.method === 'POST') return aiOptimize(request, env);

    // AI Memory — conversation history + long-term memory
    if (path === '/api/ai/history'  && request.method === 'GET')    return getAiHistory(request, env);
    if (path === '/api/ai/message'  && request.method === 'POST')   return saveAiMessage(request, env);
    if (path === '/api/ai/memory'   && request.method === 'GET')    return getAiMemory(env);
    if (path === '/api/ai/memory'   && request.method === 'PUT')    return updateAiMemory(request, env);
    if (path === '/api/ai/history'  && request.method === 'DELETE') return clearAiHistory(env);

    // ─────────────────────────────────────────────────────
    //  PERSONAL ROUTES
    // ─────────────────────────────────────────────────────

    const personal = [
      { prefix: '/api/personal/tasks',      table: 'tasks' },
      { prefix: '/api/personal/notes',      table: 'notes' },
      { prefix: '/api/personal/events',     table: 'events' },
      { prefix: '/api/personal/categories', table: 'categories' },
      { prefix: '/api/personal/habits',     table: 'habits' },
      { prefix: '/api/personal/ideas',      table: 'ideas' },
    ];

    for (const { prefix, table } of personal) {
      if (path === prefix) {
        if (request.method === 'GET')  return getAll(table, env);
        if (request.method === 'POST') return createRow(table, request, env);
      }
      if (path.startsWith(prefix + '/')) {
        const id = path.slice(prefix.length + 1);
        if (request.method === 'PUT')    return updateRow(table, id, request, env);
        if (request.method === 'DELETE') return deleteRow(table, id, env);
      }
    }

    return err('Not found', 404);
  },
};

// ═══════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════

async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  const { email, password } = body || {};
  if (!email || !password) return err('Email and password required');
  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    return err('Invalid credentials', 401);
  }
  const token = await signJWT({
    sub: 'admin',
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  }, env.JWT_SECRET);
  return json({ token, email, role: 'admin' });
}

// ═══════════════════════════════════════════════════════
//  GENERIC CRUD (personal tables)
// ═══════════════════════════════════════════════════════

async function getAll(table, env) {
  try {
    const { results } = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC`).all();
    return json(results.map(parseRow));
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function createRow(table, request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  const id   = body.id || newId();
  const data = JSON.stringify({ ...body, id: undefined });
  const now  = new Date().toISOString();
  try {
    await env.DB.prepare(
      `INSERT INTO ${table} (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)`
    ).bind(id, data, now, now).run();
    return json({ ...body, id, createdAt: now, updatedAt: now }, 201);
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function updateRow(table, id, request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  const now = new Date().toISOString();
  try {
    const existing = await env.DB.prepare(`SELECT data FROM ${table} WHERE id = ?`).bind(id).first();
    if (!existing) return err('Not found', 404);
    const merged = { ...JSON.parse(existing.data || '{}'), ...body };
    await env.DB.prepare(
      `UPDATE ${table} SET data = ?, updated_at = ? WHERE id = ?`
    ).bind(JSON.stringify(merged), now, id).run();
    return json({ ...merged, id, updatedAt: now });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function deleteRow(table, id, env) {
  try {
    await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
    return json({ deleted: true, id });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

function parseRow(row) {
  try {
    const data = JSON.parse(row.data || '{}');
    return { ...data, id: row.id, createdAt: row.created_at, updatedAt: row.updated_at };
  } catch { return { id: row.id, createdAt: row.created_at }; }
}

// ═══════════════════════════════════════════════════════
//  BLOGS — PUBLIC
// ═══════════════════════════════════════════════════════

async function getPublicBlogs(env) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM blog_posts WHERE status = ? ORDER BY sort_order ASC, created_at DESC'
    ).bind('published').all();
    return json(results.map(r => ({
      id:            r.id,
      title:         r.title,
      slug:          r.slug,
      description:   r.description,
      content:       r.content,
      tags:          JSON.parse(r.tags || '[]'),
      featuredImage: r.featured_image,
      ogImage:       r.og_image,
      publishDate:   r.publish_date,
      createdAt:     r.created_at,
    })));
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function getPublicBlogBySlug(slug, env) {
  try {
    const row = await env.DB.prepare(
      'SELECT * FROM blog_posts WHERE slug = ? AND status = ?'
    ).bind(slug, 'published').first();
    if (!row) return err('Not found', 404);
    return json({
      id:                 row.id,
      title:              row.title,
      slug:               row.slug,
      description:        row.description,
      content:            row.content,
      tags:               JSON.parse(row.tags || '[]'),
      featuredImage:      row.featured_image,
      seoTitle:           row.seo_title,
      seoDescription:     row.seo_description,
      seoKeywords:        row.seo_keywords,
      ogTitle:            row.og_title,
      ogImage:            row.og_image,
      canonical:          row.canonical,
      shareTextX:         row.share_text_x,
      shareTextLinkedin:  row.share_text_linkedin,
      shareTextInstagram: row.share_text_instagram,
      publishDate:        row.publish_date,
      createdAt:          row.created_at,
      updatedAt:          row.updated_at,
    });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

// ═══════════════════════════════════════════════════════
//  BLOGS — ADMIN
// ═══════════════════════════════════════════════════════

async function getBlogs(env) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM blog_posts ORDER BY sort_order ASC, created_at DESC').all();
    return json(results.map(r => ({
      id:                 r.id,
      title:              r.title,
      slug:               r.slug,
      description:        r.description,
      content:            r.content,
      status:             r.status,
      tags:               JSON.parse(r.tags || '[]'),
      featuredImage:      r.featured_image,
      sortOrder:          r.sort_order,
      seoTitle:           r.seo_title,
      seoDescription:     r.seo_description,
      seoKeywords:        r.seo_keywords,
      seoScore:           r.seo_score,
      ogTitle:            r.og_title,
      ogImage:            r.og_image,
      canonical:          r.canonical,
      shareTextX:         r.share_text_x,
      shareTextLinkedin:  r.share_text_linkedin,
      shareTextInstagram: r.share_text_instagram,
      publishDate:        r.publish_date,
      createdAt:          r.created_at,
      updatedAt:          r.updated_at,
    })));
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function createBlog(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  const id  = newId();
  const now = new Date().toISOString();
  const { title, slug, description, content, status, tags, featuredImage,
          seoTitle, seoDescription, seoKeywords, seoScore, ogTitle, ogImage, canonical,
          shareTextX, shareTextLinkedin, shareTextInstagram, publishDate } = body;
  if (!title) return err('Title required');
  if (!slug)  return err('Slug required');
  try {
    const { results: existing } = await env.DB.prepare(
      'SELECT sort_order FROM blog_posts ORDER BY sort_order DESC LIMIT 1'
    ).all();
    const maxOrder = existing[0] ? (existing[0].sort_order || 0) + 1 : 1;
    await env.DB.prepare(`
      INSERT INTO blog_posts
        (id, title, slug, description, content, status, tags, featured_image, sort_order,
         seo_title, seo_description, seo_keywords, seo_score,
         og_title, og_image, canonical,
         share_text_x, share_text_linkedin, share_text_instagram,
         publish_date, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id, title, slug, description||null, content||null, status||'draft',
      JSON.stringify(tags||[]), featuredImage||null, maxOrder,
      seoTitle||null, seoDescription||null, seoKeywords||null, seoScore||0,
      ogTitle||null, ogImage||null, canonical||null,
      shareTextX||null, shareTextLinkedin||null, shareTextInstagram||null,
      publishDate||null, now, now
    ).run();
    return json({ id, title, slug, description, content, status: status||'draft',
      tags: tags||[], featuredImage, sortOrder: maxOrder,
      seoTitle, seoDescription, seoKeywords, seoScore,
      ogTitle, ogImage, canonical, shareTextX, shareTextLinkedin, shareTextInstagram,
      publishDate, createdAt: now, updatedAt: now }, 201);
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function updateBlog(id, request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  const now = new Date().toISOString();
  const { title, slug, description, content, status, tags, featuredImage,
          seoTitle, seoDescription, seoKeywords, seoScore, ogTitle, ogImage, canonical,
          shareTextX, shareTextLinkedin, shareTextInstagram, publishDate } = body;
  try {
    const existing = await env.DB.prepare('SELECT id FROM blog_posts WHERE id = ?').bind(id).first();
    if (!existing) return err('Not found', 404);
    await env.DB.prepare(`
      UPDATE blog_posts SET
        title=?, slug=?, description=?, content=?, status=?,
        tags=?, featured_image=?,
        seo_title=?, seo_description=?, seo_keywords=?, seo_score=?,
        og_title=?, og_image=?, canonical=?,
        share_text_x=?, share_text_linkedin=?, share_text_instagram=?,
        publish_date=?, updated_at=?
      WHERE id=?
    `).bind(
      title, slug, description||null, content||null, status||'draft',
      JSON.stringify(tags||[]), featuredImage||null,
      seoTitle||null, seoDescription||null, seoKeywords||null, seoScore||0,
      ogTitle||null, ogImage||null, canonical||null,
      shareTextX||null, shareTextLinkedin||null, shareTextInstagram||null,
      publishDate||null, now, id
    ).run();
    return json({ id, title, slug, description, content, status,
      tags: tags||[], featuredImage,
      seoTitle, seoDescription, seoKeywords, seoScore,
      ogTitle, ogImage, canonical, shareTextX, shareTextLinkedin, shareTextInstagram,
      publishDate, updatedAt: now });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function deleteBlog(id, env) {
  try {
    await env.DB.prepare('DELETE FROM blog_posts WHERE id = ?').bind(id).run();
    return json({ deleted: true, id });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function reorderBlogs(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  const { order } = body || {};
  if (!Array.isArray(order)) return err('order array required');
  try {
    const stmts = order.map(({ id, sortOrder }) =>
      env.DB.prepare('UPDATE blog_posts SET sort_order = ? WHERE id = ?').bind(sortOrder, id)
    );
    await env.DB.batch(stmts);
    return json({ updated: order.length });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

// ═══════════════════════════════════════════════════════
//  MESSAGES
// ═══════════════════════════════════════════════════════

async function getMessages(env) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
    return json(results.map(r => ({
      id: r.id, name: r.name, email: r.email,
      message: r.message, read: !!r.read,
      createdAt: r.created_at,
    })));
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function markMessageRead(id, env) {
  try {
    await env.DB.prepare('UPDATE messages SET read = 1 WHERE id = ?').bind(id).run();
    return json({ id, read: true });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function markAllMessagesRead(env) {
  try {
    await env.DB.prepare('UPDATE messages SET read = 1').run();
    return json({ updated: true });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function deleteMessage(id, env) {
  try {
    await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
    return json({ deleted: true, id });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

// Public: contact form
async function handleContact(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  const { name, email, message } = body || {};
  if (!name || !email || !message) return err('name, email, message required');
  const id  = newId();
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      'INSERT INTO messages (id, name, email, message, read, created_at) VALUES (?, ?, ?, ?, 0, ?)'
    ).bind(id, name, email, message, now).run();
    return json({ success: true, id }, 201);
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

// ═══════════════════════════════════════════════════════
//  SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════

async function getSubscriptions(env) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM subscriptions ORDER BY created_at DESC').all();
    return json(results.map(r => ({
      id: r.id, email: r.email, name: r.name || '',
      read: !!r.read, createdAt: r.created_at,
    })));
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function markSubRead(id, env) {
  try {
    await env.DB.prepare('UPDATE subscriptions SET read = 1 WHERE id = ?').bind(id).run();
    return json({ id, read: true });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function markAllSubsRead(env) {
  try {
    await env.DB.prepare('UPDATE subscriptions SET read = 1').run();
    return json({ updated: true });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

async function deleteSubscription(id, env) {
  try {
    await env.DB.prepare('DELETE FROM subscriptions WHERE id = ?').bind(id).run();
    return json({ deleted: true, id });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

// Public: newsletter subscribe
async function handleSubscribe(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  const { email, name } = body || {};
  if (!email || !email.includes('@')) return err('Valid email required');
  const id  = newId();
  const now = new Date().toISOString();
  try {
    const existing = await env.DB.prepare('SELECT id FROM subscriptions WHERE email = ?').bind(email).first();
    if (existing) return json({ success: true, message: 'Already subscribed' });
    await env.DB.prepare(
      'INSERT INTO subscriptions (id, email, name, read, created_at) VALUES (?, ?, ?, 0, ?)'
    ).bind(id, email, name || '', now).run();
    return json({ success: true, id }, 201);
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

// ═══════════════════════════════════════════════════════
//  AI MEMORY — conversation history + long-term summary
// ═══════════════════════════════════════════════════════

// GET /api/ai/history?limit=40
// Returns last N messages newest-first + the memory summary
async function getAiHistory(request, env) {
  try {
    const url    = new URL(request.url);
    const limit  = Math.min(parseInt(url.searchParams.get('limit') || '60'), 200);
    const { results } = await env.DB.prepare(
      'SELECT id, role, content, created_at FROM ai_messages ORDER BY created_at DESC LIMIT ?'
    ).bind(limit).all();
    // Return oldest-first so the AI gets proper conversation order
    const messages = results.reverse().map(r => ({
      id: r.id, role: r.role, content: r.content, createdAt: r.created_at,
    }));
    const memRow = await env.DB.prepare('SELECT summary, updated_at FROM ai_memory WHERE id = ?').bind('singleton').first();
    return json({ messages, memory: memRow?.summary || '', memoryUpdatedAt: memRow?.updated_at || null });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

// POST /api/ai/message  { role, content }
async function saveAiMessage(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  const { role, content } = body || {};
  if (!role || !content) return err('role and content required');
  if (!['user', 'assistant'].includes(role)) return err('role must be user or assistant');
  const id  = newId();
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      'INSERT INTO ai_messages (id, role, content, created_at) VALUES (?, ?, ?, ?)'
    ).bind(id, role, content, now).run();
    // Keep only the last 200 messages to prevent unbounded growth
    await env.DB.prepare(
      `DELETE FROM ai_messages WHERE id NOT IN (
        SELECT id FROM ai_messages ORDER BY created_at DESC LIMIT 200
      )`
    ).run();
    return json({ id, role, content, createdAt: now }, 201);
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

// GET /api/ai/memory
async function getAiMemory(env) {
  try {
    const row = await env.DB.prepare('SELECT summary, updated_at FROM ai_memory WHERE id = ?').bind('singleton').first();
    return json({ summary: row?.summary || '', updatedAt: row?.updated_at || null });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

// PUT /api/ai/memory  { summary }
// Called after conversations to update the long-term memory summary
async function updateAiMemory(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  const { summary } = body || {};
  if (typeof summary !== 'string') return err('summary string required');
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      `INSERT INTO ai_memory (id, summary, updated_at) VALUES ('singleton', ?, ?)
       ON CONFLICT(id) DO UPDATE SET summary = excluded.summary, updated_at = excluded.updated_at`
    ).bind(summary, now).run();
    return json({ updated: true, updatedAt: now });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

// DELETE /api/ai/history — clear all messages (keep memory summary)
async function clearAiHistory(env) {
  try {
    await env.DB.prepare('DELETE FROM ai_messages').run();
    return json({ cleared: true });
  } catch(e) { return err('DB error: ' + e.message, 500); }
}

// ═══════════════════════════════════════════════════════
//  AI OPTIMIZE  (proxies Anthropic API)
// ═══════════════════════════════════════════════════════

async function aiOptimize(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  const { type, title, description, content, keywords } = body || {};

  const prompts = {
    seo_title:    `Generate 3 compelling SEO title variations for this blog post. Each under 70 chars.\nTitle: "${title}"\nDescription: "${description}"\nReturn only numbered list, no extra text.`,
    seo_desc:     `Generate 3 meta descriptions (under 155 chars each) for:\nTitle: "${title}"\nContent: "${(content||'').slice(0,500)}"\nReturn only numbered list.`,
    keywords:     `Extract 10 SEO keywords for this blog post as a comma-separated list.\nTitle: "${title}"\nDescription: "${description}"\nReturn only the comma-separated keywords.`,
    improve_desc: `Improve this blog post description to be more compelling (under 160 chars):\n"${description}"\nReturn only the improved description.`,
    share_x:      `Write 3 engaging X (Twitter) posts for this blog.\nTitle: "${title}"\nDescription: "${description}"\nEach under 280 chars. Return numbered list.`,
    share_linkedin:`Write 3 professional LinkedIn posts for this blog.\nTitle: "${title}"\nDescription: "${description}"\nReturn numbered list.`,
    share_instagram:`Write an Instagram caption with relevant hashtags for:\nTitle: "${title}"\nDescription: "${description}"`,
  };

  const prompt = prompts[type];
  if (!prompt) return err('Unknown type: ' + type);

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return err('GEMINI_API_KEY not configured. Add it as a Worker secret in Cloudflare dashboard.');

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 512 },
      }),
    });
    const data = await res.json();
    if (!res.ok) return err(data.error?.message || 'Gemini API error', res.status);
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return json({ result });
  } catch(e) { return err('AI request failed: ' + e.message, 500); }
    }
