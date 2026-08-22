-- Migration: Create connected_accounts table for per-user Composio OAuth toolkits
CREATE TABLE IF NOT EXISTS connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    toolkit TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('connected', 'pending', 'disconnected')),
    composio_connection_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_toolkit UNIQUE (user_id, toolkit)
);

-- Enable Row Level Security (RLS)
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for Authenticated Users (User Isolation)
CREATE POLICY "Users can view their own connected accounts"
ON connected_accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own connected accounts"
ON connected_accounts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own connected accounts"
ON connected_accounts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own connected accounts"
ON connected_accounts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access on connected_accounts"
ON connected_accounts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Index for fast lookup by user and toolkit
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_toolkit 
ON connected_accounts (user_id, toolkit);

-- Grants
GRANT ALL ON connected_accounts TO authenticated;
GRANT ALL ON connected_accounts TO service_role;
