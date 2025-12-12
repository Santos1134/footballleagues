-- COMPREHENSIVE CUP ADMIN FIX
-- This script will:
-- 1. Allow you to delete problematic profiles
-- 2. Show what cup admin can currently access
-- 3. Fix ALL RLS policies to restrict cup admin properly

-- =====================================================
-- PART 1: ENABLE PROFILE DELETION
-- =====================================================

-- Temporarily add delete policy for super admins
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;
CREATE POLICY "Super admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.managed_league_id IS NULL
      AND p.managed_cup_id IS NULL
    )
  );

-- =====================================================
-- PART 2: DIAGNOSTIC - CHECK CURRENT STATE
-- =====================================================

-- Show all admins
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

-- Check all tables and their RLS policies
SELECT
  t.tablename,
  COUNT(p.policyname) as policy_count,
  STRING_AGG(p.policyname, ', ' ORDER BY p.policyname) as policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
AND t.tablename IN (
  'leagues', 'divisions', 'teams', 'players', 'matches', 'standings',
  'cups', 'cup_groups', 'cup_teams', 'cup_matches',
  'transfers', 'announcements', 'profiles'
)
GROUP BY t.tablename
ORDER BY t.tablename;

-- =====================================================
-- PART 3: FIX LEAGUES (Super admin only, NO cup admin access)
-- =====================================================

DROP POLICY IF EXISTS "Leagues are viewable by everyone" ON leagues;
DROP POLICY IF EXISTS "Only admins can manage leagues" ON leagues;
DROP POLICY IF EXISTS "Super admins can insert leagues" ON leagues;
DROP POLICY IF EXISTS "Admins can update leagues" ON leagues;
DROP POLICY IF EXISTS "Admins can delete leagues" ON leagues;

-- Everyone can view
CREATE POLICY "Leagues are viewable by everyone"
  ON leagues FOR SELECT
  USING (true);

-- Only super admins can manage leagues
CREATE POLICY "Only super admins can manage leagues"
  ON leagues FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.managed_league_id IS NULL
      AND profiles.managed_cup_id IS NULL
    )
  );

-- =====================================================
-- PART 4: FIX DIVISIONS (Super admin only, NO cup admin access)
-- =====================================================

DROP POLICY IF EXISTS "Divisions are viewable by everyone" ON divisions;
DROP POLICY IF EXISTS "Only admins can manage divisions" ON divisions;
DROP POLICY IF EXISTS "Admins can manage divisions" ON divisions;

CREATE POLICY "Divisions are viewable by everyone"
  ON divisions FOR SELECT
  USING (true);

CREATE POLICY "Only super admins can manage divisions"
  ON divisions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.managed_league_id IS NULL
      AND profiles.managed_cup_id IS NULL
    )
  );

-- =====================================================
-- PART 5: FIX TEAMS (Super admin only, NO cup admin access to league teams)
-- =====================================================

DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
DROP POLICY IF EXISTS "Admins can manage all teams" ON teams;
DROP POLICY IF EXISTS "Team managers can manage own team" ON teams;

CREATE POLICY "Teams are viewable by everyone"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "Only super admins can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.managed_league_id IS NULL
      AND profiles.managed_cup_id IS NULL
    )
  );

CREATE POLICY "Team managers can update own team"
  ON teams FOR UPDATE
  TO authenticated
  USING (manager_id = auth.uid());

-- =====================================================
-- PART 6: FIX PLAYERS (Super admin only, NO cup admin access to league players)
-- =====================================================

DROP POLICY IF EXISTS "Players are viewable by everyone" ON players;
DROP POLICY IF EXISTS "Admins can manage all players" ON players;
DROP POLICY IF EXISTS "Team managers can manage their players" ON players;

CREATE POLICY "Players are viewable by everyone"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "Only super admins can manage players"
  ON players FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.managed_league_id IS NULL
      AND profiles.managed_cup_id IS NULL
    )
  );

CREATE POLICY "Team managers can manage their players"
  ON players FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE manager_id = auth.uid()
    )
  );

-- =====================================================
-- PART 7: FIX MATCHES (Super admin only, NO cup admin access to league matches)
-- =====================================================

DROP POLICY IF EXISTS "Matches are viewable by everyone" ON matches;
DROP POLICY IF EXISTS "Admins can manage all matches" ON matches;

CREATE POLICY "Matches are viewable by everyone"
  ON matches FOR SELECT
  USING (true);

CREATE POLICY "Only super admins can manage matches"
  ON matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.managed_league_id IS NULL
      AND profiles.managed_cup_id IS NULL
    )
  );

-- =====================================================
-- PART 8: FIX CUPS (Super admin and cup-specific admin only)
-- =====================================================

DROP POLICY IF EXISTS "Cups are viewable by everyone" ON cups;
DROP POLICY IF EXISTS "Admins can insert cups" ON cups;
DROP POLICY IF EXISTS "Admins can update cups" ON cups;
DROP POLICY IF EXISTS "Admins can delete cups" ON cups;
DROP POLICY IF EXISTS "Super admins can insert cups" ON cups;

CREATE POLICY "Cups are viewable by everyone"
  ON cups FOR SELECT
  USING (true);

-- Only super admins can create cups
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

-- Super admins and cup admins can update ONLY their assigned cup
CREATE POLICY "Admins can update cups"
  ON cups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        (profiles.role = 'admin' AND profiles.managed_league_id IS NULL AND profiles.managed_cup_id IS NULL) OR
        (profiles.role = 'league_admin' AND profiles.managed_cup_id = cups.id)
      )
    )
  );

-- Super admins and cup admins can delete ONLY their assigned cup
CREATE POLICY "Admins can delete cups"
  ON cups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        (profiles.role = 'admin' AND profiles.managed_league_id IS NULL AND profiles.managed_cup_id IS NULL) OR
        (profiles.role = 'league_admin' AND profiles.managed_cup_id = cups.id)
      )
    )
  );

-- =====================================================
-- PART 9: VERIFICATION
-- =====================================================

-- Show final policy count for each table
SELECT
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'leagues', 'divisions', 'teams', 'players', 'matches',
  'cups', 'cup_groups', 'cup_teams', 'cup_matches'
)
GROUP BY tablename
ORDER BY tablename;

-- Test what cup admin can see (run this while logged in as cup admin)
SELECT 'Leagues' as table_name, COUNT(*) as accessible_rows FROM leagues
UNION ALL
SELECT 'Divisions', COUNT(*) FROM divisions
UNION ALL
SELECT 'Teams', COUNT(*) FROM teams
UNION ALL
SELECT 'Players', COUNT(*) FROM players
UNION ALL
SELECT 'Matches', COUNT(*) FROM matches
UNION ALL
SELECT 'Cups', COUNT(*) FROM cups;

-- Expected result for cup admin:
-- Leagues: 0 (should see all for viewing, but can't manage)
-- Divisions: 0 (should see all for viewing, but can't manage)
-- Teams: 0 (should see all for viewing, but can't manage)
-- Players: 0 (should see all for viewing, but can't manage)
-- Matches: 0 (should see all for viewing, but can't manage)
-- Cups: 1 (should only see their assigned cup)
