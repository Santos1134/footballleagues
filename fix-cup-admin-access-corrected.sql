-- VERIFY AND FIX CUP ADMIN ACCESS (CORRECTED)
-- This ensures cup admins can ONLY access their assigned cup, not everything

-- Step 1: Check current admins
SELECT
  email,
  role,
  managed_league_id,
  managed_cup_id,
  CASE
    WHEN managed_league_id IS NOT NULL THEN 'League Admin'
    WHEN managed_cup_id IS NOT NULL THEN 'Cup Admin'
    WHEN role = 'admin' THEN 'Super Admin'
    ELSE 'No Assignment'
  END as admin_type
FROM profiles
WHERE role IN ('admin', 'league_admin')
ORDER BY created_at DESC;

-- Step 2: Check which cup tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'cup%'
ORDER BY table_name;

-- Step 3: Verify cup admin RLS policies exist
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('cups', 'cup_groups', 'cup_teams', 'cup_matches')
ORDER BY tablename, policyname;

-- Step 4: Fix cups table policies
DROP POLICY IF EXISTS "Admins can insert cups" ON cups;
DROP POLICY IF EXISTS "Admins can update cups" ON cups;
DROP POLICY IF EXISTS "Admins can delete cups" ON cups;
DROP POLICY IF EXISTS "Super admins can insert cups" ON cups;

-- Super admins can create cups (not cup-specific admins)
CREATE POLICY "Super admins can insert cups"
  ON cups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.managed_league_id IS NULL
      AND profiles.managed_cup_id IS NULL
    )
  );

-- Super admins and cup admins can update their own cup
CREATE POLICY "Admins can update cups"
  ON cups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        -- Super admin (can update all cups)
        (profiles.role = 'admin' AND profiles.managed_league_id IS NULL AND profiles.managed_cup_id IS NULL) OR
        -- Cup admin managing this specific cup
        (profiles.role = 'league_admin' AND profiles.managed_cup_id = cups.id)
      )
    )
  );

-- Super admins and cup admins can delete their own cup
CREATE POLICY "Admins can delete cups"
  ON cups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        -- Super admin (can delete all cups)
        (profiles.role = 'admin' AND profiles.managed_league_id IS NULL AND profiles.managed_cup_id IS NULL) OR
        -- Cup admin managing this specific cup
        (profiles.role = 'league_admin' AND profiles.managed_cup_id = cups.id)
      )
    )
  );

-- Step 5: Fix cup_groups policies (if table exists)
DROP POLICY IF EXISTS "Admins can manage cup groups" ON cup_groups;

CREATE POLICY "Admins can manage cup groups"
  ON cup_groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN cups c ON c.id = cup_groups.cup_id
      WHERE p.id = auth.uid()
      AND (
        -- Super admin
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        -- Cup admin managing this specific cup
        (p.role = 'league_admin' AND p.managed_cup_id = c.id)
      )
    )
  );

-- Step 6: Fix cup_teams policies (if table exists)
DROP POLICY IF EXISTS "Admins can manage cup teams" ON cup_teams;

CREATE POLICY "Admins can manage cup teams"
  ON cup_teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN cups c ON c.id = cup_teams.cup_id
      WHERE p.id = auth.uid()
      AND (
        -- Super admin
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        -- Cup admin managing this specific cup
        (p.role = 'league_admin' AND p.managed_cup_id = c.id)
      )
    )
  );

-- Step 7: Fix cup_matches policies (if table exists)
DROP POLICY IF EXISTS "Admins can manage cup matches" ON cup_matches;

CREATE POLICY "Admins can manage cup matches"
  ON cup_matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN cups c ON c.id = cup_matches.cup_id
      WHERE p.id = auth.uid()
      AND (
        -- Super admin
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        -- Cup admin managing this specific cup
        (p.role = 'league_admin' AND p.managed_cup_id = c.id)
      )
    )
  );

-- Step 8: Verify the policies were created correctly
SELECT
  tablename,
  policyname,
  cmd,
  'Policy created successfully' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('cups', 'cup_groups', 'cup_teams', 'cup_matches')
ORDER BY tablename, policyname;

-- Step 9: Test - Check that cup admins can only see their cup
-- (This should only show the cup you manage when logged in as cup admin)
SELECT
  id,
  name,
  created_at,
  'You should only see cups you can access' as note
FROM cups
ORDER BY created_at DESC;
