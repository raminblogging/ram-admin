-- ═══════════════════════════════════════════════════════
--  Ram.OS — D1 Database Schema
--  Run: wrangler d1 execute ramsrinivasan-db --remote --file=src/schema.sql
-- ═══════════════════════════════════════════════════════

-- ── BLOG POSTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blogs (
  id          TEXT    PRIMARY KEY,
  data        TEXT    NOT NULL DEFAULT '{}',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blogs_sort   ON blogs(sort_order);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(json_extract(data, '$.status'));

-- ── PERSONAL: TASKS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  data        TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks(json_extract(data, '$.done'));

-- ── PERSONAL: NOTES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id          TEXT PRIMARY KEY,
  data        TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- ── PERSONAL: EVENTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  data        TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(json_extract(data, '$.date'));

-- ── PERSONAL: CATEGORIES ────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  data        TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- ── MESSAGES (contact form) ──────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  message     TEXT    NOT NULL,
  read        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_date ON messages(created_at DESC);

-- ── SUBSCRIPTIONS (newsletter) ───────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id          TEXT    PRIMARY KEY,
  email       TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL DEFAULT '',
  read        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subs_read  ON subscriptions(read);
CREATE INDEX IF NOT EXISTS idx_subs_email ON subscriptions(email);

-- ── SEED: default categories ─────────────────────────────
-- You can remove these if you want a blank slate.
INSERT OR IGNORE INTO categories (id, data, created_at, updated_at) VALUES
  ('cat_work',    '{"name":"Work","icon":"💼","color":"#6366f1"}',   datetime('now'), datetime('now')),
  ('cat_personal','{"name":"Personal","icon":"🙋","color":"#a855f7"}', datetime('now'), datetime('now')),
  ('cat_health',  '{"name":"Health","icon":"💪","color":"#22c55e"}', datetime('now'), datetime('now')),
  ('cat_learning','{"name":"Learning","icon":"🧠","color":"#38bdf8"}', datetime('now'), datetime('now'));
