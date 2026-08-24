CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usage_events (
  user_id TEXT NOT NULL,
  day DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  icon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, icon_id)
);

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#FF5A1F',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections (user_id);

CREATE TABLE IF NOT EXISTS collection_icons (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  icon_id TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, icon_id)
);

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  favicon TEXT,
  palette JSONB NOT NULL DEFAULT '[]'::jsonb,
  logo_candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
  og_image TEXT,
  description TEXT,
  tokens_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brands_user ON brands (user_id);

CREATE TABLE IF NOT EXISTS shares (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('atlas','brand','collection')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
