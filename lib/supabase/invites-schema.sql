-- Run this in Supabase SQL Editor to add invite support

CREATE TABLE IF NOT EXISTS group_invites (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id      UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  token         TEXT NOT NULL UNIQUE,
  created_by    TEXT NOT NULL,
  expires_at    TIMESTAMP WITH TIME ZONE,
  max_uses      INTEGER DEFAULT 20,
  use_count     INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_token ON group_invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_group_id ON group_invites(group_id);

ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;
