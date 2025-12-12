-- Create ads table for popup advertisements
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Anyone can view active ads (public)
CREATE POLICY "Public can view active ads"
  ON ads
  FOR SELECT
  USING (is_active = true);

-- Admins can view all ads
CREATE POLICY "Admins can view all ads"
  ON ads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert ads
CREATE POLICY "Admins can insert ads"
  ON ads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update ads
CREATE POLICY "Admins can update ads"
  ON ads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete ads
CREATE POLICY "Admins can delete ads"
  ON ads
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for active ads
CREATE INDEX idx_ads_active ON ads(is_active) WHERE is_active = true;
