-- Add user_id to scans (nullable for anonymous scans)
ALTER TABLE scans ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);

-- RLS on scans
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
-- Anyone can read scans by ID (public results pages)
CREATE POLICY "Public can read scans by id" ON scans FOR SELECT USING (true);
-- Anyone can insert scans (API uses service role, but this covers edge cases)
CREATE POLICY "Anyone can insert scans" ON scans FOR INSERT WITH CHECK (true);
