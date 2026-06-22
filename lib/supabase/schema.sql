-- Travel Kitty — Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- Groups
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  created_by    TEXT NOT NULL,              -- Clerk user ID
  ai_monthly_budget DECIMAL(10,2) DEFAULT 50.00,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Group Members
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id      UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id       TEXT,                       -- Clerk user ID (null until they join)
  first_name    TEXT NOT NULL,
  email         TEXT NOT NULL,
  colour        TEXT NOT NULL DEFAULT '#7D9B76',
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, email)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- ─────────────────────────────────────────────
-- Ledger Entries
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_entries (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id      UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  date          DATE NOT NULL,
  description   TEXT NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'interest', 'expense')),
  member_id     UUID REFERENCES group_members(id) ON DELETE SET NULL,
  category      TEXT,
  notes         TEXT,
  import_id     UUID,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_group_id ON ledger_entries(group_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON ledger_entries(date);
CREATE INDEX IF NOT EXISTS idx_ledger_member_id ON ledger_entries(member_id);

-- ─────────────────────────────────────────────
-- Statement Imports
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS statement_imports (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id      UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  filename      TEXT NOT NULL,
  imported_by   TEXT NOT NULL,
  entries_count INTEGER DEFAULT 0,
  raw_content   TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Destination Folders
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS destination_folders (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id          UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  name              TEXT NOT NULL,
  destination       TEXT,
  country           TEXT,
  cover_image_url   TEXT,
  cover_image_credit TEXT,
  target_date       TEXT,
  created_by        TEXT NOT NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_group_id ON destination_folders(group_id);

-- ─────────────────────────────────────────────
-- Itineraries
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itineraries (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id       UUID REFERENCES destination_folders(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1,
  prompt          TEXT,
  content         JSONB NOT NULL,
  total_cost      DECIMAL(12,2),
  cost_per_person DECIMAL(12,2),
  duration_days   INTEGER,
  created_by      TEXT NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itineraries_folder_id ON itineraries(folder_id);

-- ─────────────────────────────────────────────
-- Itinerary Votes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itinerary_votes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id  UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  item_id       TEXT NOT NULL,
  member_id     UUID REFERENCES group_members(id) ON DELETE CASCADE NOT NULL,
  vote_type     TEXT NOT NULL CHECK (vote_type IN ('love', 'not_for_me')),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(itinerary_id, item_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_itinerary_id ON itinerary_votes(itinerary_id);

-- ─────────────────────────────────────────────
-- Folder Notes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folder_notes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id     UUID REFERENCES destination_folders(id) ON DELETE CASCADE NOT NULL,
  content       TEXT NOT NULL,
  created_by    TEXT NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Folder Images
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folder_images (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id     UUID REFERENCES destination_folders(id) ON DELETE CASCADE NOT NULL,
  url           TEXT NOT NULL,
  caption       TEXT,
  credit        TEXT,
  added_by      TEXT NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_folder_id ON folder_images(folder_id);

-- ─────────────────────────────────────────────
-- Message Threads
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_threads (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id      UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  folder_id     UUID REFERENCES destination_folders(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  category      TEXT,
  created_by    TEXT NOT NULL,
  is_pinned     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threads_group_id ON message_threads(group_id);
CREATE INDEX IF NOT EXISTS idx_threads_folder_id ON message_threads(folder_id);

-- ─────────────────────────────────────────────
-- Message Posts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_posts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id     UUID REFERENCES message_threads(id) ON DELETE CASCADE NOT NULL,
  content       TEXT NOT NULL,
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON message_posts(thread_id);

-- ─────────────────────────────────────────────
-- Calendar Availability
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_availability (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id      UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  member_id     UUID REFERENCES group_members(id) ON DELETE CASCADE NOT NULL,
  date          DATE NOT NULL,
  preference    TEXT NOT NULL CHECK (preference IN ('preferred', 'available', 'unavailable')),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, member_id, date)
);

CREATE INDEX IF NOT EXISTS idx_availability_group_id ON calendar_availability(group_id);
CREATE INDEX IF NOT EXISTS idx_availability_member_id ON calendar_availability(member_id);
CREATE INDEX IF NOT EXISTS idx_availability_date ON calendar_availability(date);

-- ─────────────────────────────────────────────
-- AI Usage Tracking
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id      UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  feature       TEXT NOT NULL,
  input_tokens  INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd      DECIMAL(10,6) DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_group_id ON ai_usage(group_id);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- NOTE: With Clerk auth, the service role key is used server-side to bypass RLS.
-- Add your RLS policies here if you want to use Supabase auth directly.
-- For now, all access goes through the Next.js API routes using the service role key.

-- Allow service role to bypass RLS (default in Supabase)
-- All API routes use createServiceClient() which uses the service role key.
