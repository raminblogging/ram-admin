# Ram.OS — Complete Developer Guide
**Version 4.0 · React + Vite PWA + Cloudflare Workers + D1**

---

## Table of Contents
1. [What Is Ram.OS?](#1-what-is-ramos)
2. [Project Structure — Every File Explained](#2-project-structure)
3. [How to Run & Deploy](#3-how-to-run--deploy)
4. [Backend — Cloudflare Worker & Database](#4-backend)
5. [Frontend — React + Vite](#5-frontend)
6. [Themes & Styling](#6-themes--styling)
7. [Adding a New Page / Feature](#7-adding-a-new-page)
8. [Common Changes Reference](#8-common-changes-reference)
9. [API Endpoint Reference](#9-api-endpoint-reference)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What Is Ram.OS?

Ram.OS is a **personal life operating system** — a mobile-first Progressive Web App (PWA) that you install on your phone like a native app.

**It has two parts:**

| Part | Technology | Where it lives |
|------|-----------|----------------|
| **Frontend** | React + Vite | GitHub Pages / Cloudflare Pages |
| **Backend** | Cloudflare Worker + D1 SQLite | Cloudflare (same as before) |

The backend (`worker.js`) is **100% unchanged** from the original project. Same database, same worker ID, same API endpoints. Only the frontend was rewritten.

---

## 2. Project Structure

```
ramos-pwa/
│
├── index.html                  ← HTML entry point (Vite starts here)
├── package.json                ← npm dependencies and scripts
├── vite.config.js              ← Vite + PWA plugin configuration
├── wrangler.jsonc              ← Cloudflare Worker config (UNCHANGED)
│
├── public/                     ← Static files (copied to build output)
│   ├── icon-192.png            ← PWA icon (192×192)
│   └── icon-512.png            ← PWA icon (512×512, maskable)
│
└── src/
    ├── main.jsx                ← React app entry point
    ├── App.jsx                 ← Route definitions
    │
    ├── lib/
    │   ├── api.js              ← ALL API calls + utility helpers
    │   └── context.jsx         ← Global state (auth, theme, toast, badges)
    │
    ├── components/
    │   ├── AppShell.jsx        ← Layout: topbar + sidebar + bottom nav
    │   └── UI.jsx              ← Reusable components (Modal, Toast, etc.)
    │
    ├── styles/
    │   └── global.css          ← ALL CSS: themes, layout, components
    │
    ├── pages/
    │   ├── Login.jsx           ← Login screen
    │   ├── Dashboard.jsx       ← Home dashboard
    │   ├── Apps.jsx            ← All apps grid
    │   ├── Tasks.jsx           ← Task manager (full CRUD)
    │   ├── Notes.jsx           ← Notes (full CRUD)
    │   ├── Calendar.jsx        ← Calendar + events
    │   ├── Blog.jsx            ← Blog admin + AI optimize
    │   ├── Messages.jsx        ← Contact form messages
    │   ├── Subscriptions.jsx   ← Newsletter subscribers
    │   ├── Categories.jsx      ← Task categories
    │   ├── Settings.jsx        ← Theme switcher + API config
    │   ├── AI.jsx              ← Ramai AI chat (Claude API)
    │   ├── Habits.jsx          ← Habit tracker with streaks
    │   ├── Ideas.jsx           ← Idea capture + status board
    │   └── LifestylePages.jsx  ← Gym, Drawing, Learning, Tracker, Productivity
    │
    └── worker/
        ├── worker.js           ← Cloudflare Worker (UNCHANGED from original)
        └── schema.sql          ← Database schema (UNCHANGED from original)
```

---

## 3. How to Run & Deploy

### Prerequisites
- Node.js 18+
- npm
- Wrangler CLI (for backend): `npm install -g wrangler`

### Run locally (frontend only)

```bash
cd ramos-pwa
npm install
npm run dev
```
→ Opens at `http://localhost:5173`

> ℹ️ The app will talk to the live Cloudflare Worker API automatically.
> You can change the API URL in Settings → API Configuration if needed.

### Build for production

```bash
npm run build
```
→ Creates a `dist/` folder ready to deploy.

### Deploy frontend (GitHub Pages)

```bash
# Install GitHub Pages deploy tool
npm install -D gh-pages

# Add to package.json scripts:
# "deploy": "gh-pages -d dist"

npm run build
npm run deploy
```

Or use **Cloudflare Pages** (recommended):
1. Push this repo to GitHub
2. Go to Cloudflare Pages → Create project → Connect GitHub
3. Build command: `npm run build`
4. Output directory: `dist`

### Deploy backend (Worker) — same as original

```bash
# Deploy the worker
wrangler deploy

# First time: set up the database
wrangler d1 execute ramsrinivasan-db --remote --file=src/worker/schema.sql

# Set secrets (run once each)
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_EMAIL
wrangler secret put ADMIN_PASSWORD
wrangler secret put GEMINI_API_KEY   # for AI optimize in blog
```

---

## 4. Backend

### Files
| File | Purpose |
|------|---------|
| `src/worker/worker.js` | The entire API — all routes, auth, DB queries |
| `src/worker/schema.sql` | Database table definitions |
| `wrangler.jsonc` | Worker name, database binding, routes |

### Database (D1 SQLite)
**Database ID:** `56eabc71-43cd-4850-b4d0-b08eb588f275`
**Database Name:** `ramsrinivasan-db`

**Tables:**
| Table | What it stores |
|-------|---------------|
| `blogs` | Blog posts (title, content, SEO fields, status) |
| `tasks` | Tasks (title, priority, due date, done flag) |
| `notes` | Notes (title, content) |
| `events` | Calendar events (title, date, time) |
| `categories` | Task categories (name, icon, color) |
| `messages` | Contact form submissions |
| `subscriptions` | Newsletter subscriber emails |

All personal tables (tasks, notes, events, categories) use a **generic JSON data column** — the actual fields are stored as JSON. This means you can add new fields to a task without changing the database schema.

### Auth
- Login at `POST /api/auth/login` with email + password
- Returns a **JWT token** (7 days expiry)
- All admin routes require: `Authorization: Bearer <token>`
- Public routes (no auth): `POST /api/contact`, `POST /api/subscribe`, `GET /api/blogs`

### Secrets (Cloudflare dashboard or wrangler CLI)
| Secret | Value |
|--------|-------|
| `JWT_SECRET` | Random 32-byte hex string |
| `ADMIN_EMAIL` | Your login email |
| `ADMIN_PASSWORD` | Your login password |
| `GEMINI_API_KEY` | Google Gemini key (for AI blog optimize) |

---

## 5. Frontend

### Key files

#### `src/main.jsx` — Entry point
Wraps the app in three providers: `BrowserRouter` (routing), `AppProvider` (global state), then renders `<App />`.

**If you need to add a global provider:** Add it here, wrapping `<AppProvider>`.

#### `src/App.jsx` — Routes
Defines all URL routes. Every page component is imported and mapped to a path.

**To add a new page:** Add a `<Route>` here (see Section 7).

#### `src/lib/api.js` — API layer
**This is where ALL network calls live.** Contains:
- `api(path, opts)` — base fetch wrapper with auth header
- Individual API functions: `fetchItems`, `createItem`, `updateItem`, `deleteItem`
- Blog-specific: `fetchBlogs`, `createBlog`, `updateBlog`, `deleteBlog`
- Messages: `fetchMessages`, `markMessageRead`, `deleteMessage`, etc.
- Helpers: `formatDate`, `relativeTime`, `slugify`, `lsGet`, `lsSet`

**If an API endpoint changes:** Update the function here. All pages use these functions, so you only need to change one place.

**To point to a different API:** Change `DEFAULT_API` constant, or update via Settings UI.

#### `src/lib/context.jsx` — Global state
Provides shared state across all pages:
- `isAuth` / `login()` / `logout()` — authentication
- `theme` / `setTheme()` — current colour theme
- `showToast(message, type)` — show notifications ('success' | 'error' | 'info')
- `badges` / `updateBadge(key, count)` — nav badge counts
- `searchIndex` / `addToSearchIndex(items)` — global search

**Use it in any page:**
```jsx
import { useApp } from '../lib/context'
const { showToast, theme } = useApp()
```

#### `src/components/AppShell.jsx` — Layout
The outer shell that wraps all pages. Contains:
- **Topbar** (logo + search + sign out)
- **Sidebar** (desktop — shows all navigation)
- **Bottom Nav** (mobile — 5 main tabs)

**To add a nav item:** Add to `BOTTOM_NAV` (bottom bar) or `SIDEBAR_NAV` (sidebar).

#### `src/components/UI.jsx` — Shared components
Ready-to-use UI building blocks:
| Component | What it does |
|-----------|-------------|
| `<Toast />` | Notification popup (auto-shown via `showToast()`) |
| `<Modal>` | Bottom-sheet modal dialog |
| `<ConfirmModal>` | "Are you sure?" delete confirmation |
| `<Spinner />` | Loading indicator |
| `<EmptyState>` | "Nothing here yet" placeholder |
| `<PageHeader>` | Title + subtitle + action buttons |
| `<StatsRow>` | Row of 3 stat cards |
| `<FilterPills>` | Filter buttons row |
| `<FormGroup>` | Label + input wrapper |
| `<Badge>` | Coloured status tag |
| `<FAB>` | Floating action button (bottom-right + button) |

---

## 6. Themes & Styling

### All CSS lives in `src/styles/global.css`

Themes use **CSS custom properties (variables)**. Every colour in the app references a variable like `var(--acc)` or `var(--bg2)`.

### Available themes

| Theme ID | Name | Accent |
|----------|------|--------|
| `wine` | Wine Dark (default) | Deep crimson |
| `midnight` | Midnight | Silver/grey |
| `forge` | Forge | Copper/brown |
| `obsidian` | Obsidian | Deep violet |
| `jade` | Jade | Emerald green |
| `slate` | Slate | Electric blue |

### CSS Variables reference

| Variable | Used for |
|----------|---------|
| `--bg` | Page background |
| `--bg2` | Card/panel background |
| `--bg3` | Input / secondary panel |
| `--bg4` | Hover states |
| `--bdr` | Border colour |
| `--bdr2` | Stronger border |
| `--acc` | Primary accent (buttons, highlights) |
| `--acc2` | Accent hover |
| `--acc3` | Accent text / bright colour |
| `--txt` | Primary text |
| `--txt2` | Secondary text |
| `--txt3` | Muted/disabled text |
| `--glow` | Box shadow glow colour |
| `--radius` | Default border radius (14px) |
| `--radius-sm` | Small radius (8px) |

### To add a new theme

1. Open `src/styles/global.css`
2. Copy an existing theme block (e.g. `[data-theme="slate"]`)
3. Change the selector to your new theme ID: `[data-theme="sunset"]`
4. Adjust the colour values
5. Add it to the `THEMES` array in `src/pages/Settings.jsx`

### Switching themes

The user picks a theme in Settings. The theme ID is saved to `localStorage` (`ramos_theme`) and applied as `data-theme` attribute on `<html>`.

---

## 7. Adding a New Page

Here's the exact steps, even if you've never used React before:

### Step 1 — Create the page file

Create `src/pages/MyNewPage.jsx`:

```jsx
// src/pages/MyNewPage.jsx

import { PageHeader } from '../components/UI'
import { useApp } from '../lib/context'

export default function MyNewPage() {
  const { showToast } = useApp()

  return (
    <div>
      <PageHeader title="My New Page" subtitle="Description here" />
      <p style={{ color: 'var(--txt2)' }}>Content goes here</p>
      <button className="btn btn-primary" onClick={() => showToast('Hello!', 'success')}>
        Click me
      </button>
    </div>
  )
}
```

### Step 2 — Add the route in `src/App.jsx`

```jsx
// At the top, add your import:
import MyNewPage from './pages/MyNewPage'

// Inside the <Routes> inside the protected route, add:
<Route path="/my-page" element={<MyNewPage />} />
```

### Step 3 — Add it to navigation

**For bottom bar** (shows on mobile), edit `BOTTOM_NAV` in `src/components/AppShell.jsx`:
```jsx
{ path: '/my-page', icon: '⭐', label: 'My Page' },
```

**For sidebar** (shows on desktop), edit `SIDEBAR_NAV` in the same file:
```jsx
{ path: '/my-page', icon: '⭐', label: 'My Page' },
```

**For the All Apps page**, edit `APP_SECTIONS` in `src/pages/Apps.jsx`:
```jsx
{ icon: '⭐', label: 'My Page', path: '/my-page', bubble: 'bubble-green' },
```

### Step 4 — Done!

Navigate to `/my-page` and it works. That's it.

---

## 8. Common Changes Reference

### Change the app name

| File | Line to change |
|------|---------------|
| `index.html` | `<title>Ram.OS</title>` |
| `vite.config.js` | `name: 'Ram.OS'`, `short_name: 'Ram.OS'` |
| `src/components/AppShell.jsx` | `Ram<span>.</span>OS` (appears twice) |
| `src/pages/Login.jsx` | `Ram<span>...</span>OS` |
| `src/pages/Settings.jsx` | Backend info section |

### Change the API endpoint

**Easy way:** Go to Settings → API Configuration in the app → type the new URL → Save.

**Code way:** Edit `DEFAULT_API` constant in `src/lib/api.js`:
```js
export const DEFAULT_API = 'https://your-new-worker.workers.dev'
```

### Change the accent/brand colour

Edit the `wine` theme block in `src/styles/global.css`:
```css
:root, [data-theme="wine"], [data-theme=""] {
  --acc:  #8b1a3a;  /* ← main accent */
  --acc2: #b52450;  /* ← hover */
  --acc3: #c9314c;  /* ← bright text */
}
```

### Add a field to Tasks

**Frontend** — add the input in `src/pages/Tasks.jsx`:
1. Add the field to `blankTask()` function
2. Add a `<FormGroup>` with an `<input>` in the Modal
3. Update `openEdit()` to read the field

**Backend** — no schema change needed! The backend stores all task fields as JSON. New fields are saved automatically.

### Change bottom navigation tabs

Edit `BOTTOM_NAV` array in `src/components/AppShell.jsx`. Max 5 items look good on mobile.

### Change the default theme

Edit this line in `src/lib/context.jsx`:
```jsx
const [theme, setThemeState] = useState(() => lsGet('theme', 'wine'))
//                                                              ^^^^
//                                                     Change this to: 'midnight', 'jade', etc.
```

### Add Gemini AI to blog

Set the `GEMINI_API_KEY` secret in Cloudflare:
```bash
wrangler secret put GEMINI_API_KEY
```
Then paste your Google AI Studio API key. AI buttons in Blog → SEO and Blog → Social tabs will start working.

---

## 9. API Endpoint Reference

All endpoints are on the Cloudflare Worker. Base URL: `https://ramsrinivasan-api.rammv2001.workers.dev`

### Public (no auth needed)

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/health` | Health check |
| `GET`  | `/api/blogs` | All published blog posts |
| `GET`  | `/api/blogs/:slug` | Single blog post by slug |
| `POST` | `/api/contact` | Submit contact form `{name, email, message}` |
| `POST` | `/api/subscribe` | Subscribe to newsletter `{email, name}` |
| `POST` | `/api/auth/login` | Login `{email, password}` → `{token}` |

### Admin (requires `Authorization: Bearer <token>`)

**Blog posts:**
| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/api/admin/blogs` | All posts (incl. drafts) |
| `POST`   | `/api/admin/blogs` | Create post |
| `PUT`    | `/api/admin/blogs/:id` | Update post |
| `DELETE` | `/api/admin/blogs/:id` | Delete post |
| `PUT`    | `/api/admin/blogs/reorder` | Reorder posts `{order: [{id, sortOrder}]}` |

**Messages:**
| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/api/admin/messages` | All messages |
| `PUT`    | `/api/admin/messages/:id/read` | Mark read |
| `PUT`    | `/api/admin/messages/read-all` | Mark all read |
| `DELETE` | `/api/admin/messages/:id` | Delete |

**Subscriptions:**
| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/api/admin/subscriptions` | All subscribers |
| `PUT`    | `/api/admin/subscriptions/:id/read` | Mark seen |
| `PUT`    | `/api/admin/subscriptions/read-all` | Mark all seen |
| `DELETE` | `/api/admin/subscriptions/:id` | Remove subscriber |

**Personal data (tasks, notes, events, categories):**
| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/api/personal/:table` | List all |
| `POST`   | `/api/personal/:table` | Create |
| `PUT`    | `/api/personal/:table/:id` | Update |
| `DELETE` | `/api/personal/:table/:id` | Delete |

Where `:table` is one of: `tasks`, `notes`, `events`, `categories`

**AI:**
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/admin/ai/optimize` | Generate SEO/social copy via Gemini |

---

## 10. Troubleshooting

### "Unauthorized" on all requests
→ Your token expired (7 days) or is missing. Sign out and sign back in.

### API requests fail with CORS error
→ The Worker has CORS headers set to `*`. If you've changed the Worker, make sure CORS headers are still in the response. Check `src/worker/worker.js` top section.

### App shows blank screen
→ Open browser DevTools (F12) → Console tab. Look for red errors. Common causes:
- Missing import
- Route not defined in `App.jsx`
- API error (check Network tab)

### PWA not installing / icon missing
→ Make sure `public/icon-192.png` and `public/icon-512.png` exist. Run `npm run build` and check the `dist/` folder contains them.

### Theme not applying
→ Check that `data-theme` attribute is on `<html>` element (inspect in DevTools). The `context.jsx` sets it on mount via `useEffect`.

### Blog AI buttons not working
→ Make sure `GEMINI_API_KEY` is set as a Cloudflare Worker secret. The key must be valid for the `gemini-2.0-flash` model.

### Changes to worker.js not live
→ Run `wrangler deploy` from the project root. The worker deploys in ~30 seconds.

### Can't log in
→ Check your `ADMIN_EMAIL` and `ADMIN_PASSWORD` secrets match exactly what you're typing. Secrets are case-sensitive. To reset: `wrangler secret put ADMIN_PASSWORD`.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  ADD A NEW FEATURE                                      │
│  1. Create src/pages/NewPage.jsx                        │
│  2. Add <Route> in src/App.jsx                          │
│  3. Add nav item in AppShell.jsx and/or Apps.jsx        │
│                                                         │
│  CHANGE A COLOUR                                        │
│  → src/styles/global.css  (theme variables)            │
│                                                         │
│  CHANGE API ENDPOINT                                    │
│  → src/lib/api.js  (DEFAULT_API constant)              │
│  or Settings → API Configuration in the app            │
│                                                         │
│  ADD AN API CALL                                        │
│  → src/lib/api.js  (add a new export function)        │
│                                                         │
│  CHANGE NAVIGATION                                      │
│  → src/components/AppShell.jsx  (BOTTOM_NAV, SIDEBAR_NAV)
│                                                         │
│  DEPLOY FRONTEND                                        │
│  → npm run build  →  deploy dist/ folder               │
│                                                         │
│  DEPLOY BACKEND                                        │
│  → wrangler deploy                                      │
└─────────────────────────────────────────────────────────┘
```

---

*Ram.OS v4.0 · React 18 + Vite 6 + Cloudflare Workers D1*
