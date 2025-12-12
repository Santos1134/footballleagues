-- Fix RLS policies to support league-specific admins
-- This ensures league admins can only manage their assigned league

-- =====================================================
-- LEAGUES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Only admins can manage leagues" ON leagues;

-- League admins can only update/delete their own league, super admins can do anything
CREATE POLICY "Admins can update leagues"
  ON leagues FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        -- Super admin (can manage all leagues)
        (profiles.role = 'admin' AND profiles.managed_league_id IS NULL AND profiles.managed_cup_id IS NULL) OR
        -- League admin managing this specific league
        (profiles.role = 'league_admin' AND profiles.managed_league_id = leagues.id)
      )
    )
  );

CREATE POLICY "Admins can delete leagues"
  ON leagues FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        -- Super admin (can manage all leagues)
        (profiles.role = 'admin' AND profiles.managed_league_id IS NULL AND profiles.managed_cup_id IS NULL) OR
        -- League admin managing this specific league
        (profiles.role = 'league_admin' AND profiles.managed_league_id = leagues.id)
      )
    )
  );

-- Only super admins can create leagues (not league-specific admins)
CREATE POLICY "Super admins can insert leagues"
  ON leagues FOR INSERT
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

-- =====================================================
-- DIVISIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Only admins can manage divisions" ON divisions;

CREATE POLICY "Admins can manage divisions"
  ON divisions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN leagues l ON l.id = divisions.league_id
      WHERE p.id = auth.uid()
      AND (
        -- Super admin (can manage all divisions)
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        -- League admin managing divisions in their league
        (p.role = 'league_admin' AND p.managed_league_id = l.id)
      )
    )
  );

-- =====================================================
-- TEAMS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all teams" ON teams;

CREATE POLICY "Admins can manage all teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN divisions d ON d.id = teams.division_id
      LEFT JOIN leagues l ON l.id = d.league_id
      WHERE p.id = auth.uid()
      AND (
        -- Super admin (can manage all teams)
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        -- League admin managing teams in their league
        (p.role = 'league_admin' AND p.managed_league_id = l.id)
      )
    )
  );

-- =====================================================
-- PLAYERS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all players" ON players;

CREATE POLICY "Admins can manage all players"
  ON players FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN teams t ON t.id = players.team_id
      LEFT JOIN divisions d ON d.id = t.division_id
      LEFT JOIN leagues l ON l.id = d.league_id
      WHERE p.id = auth.uid()
      AND (
        -- Super admin (can manage all players)
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        -- League admin managing players in their league
        (p.role = 'league_admin' AND p.managed_league_id = l.id)
      )
    )
  );

-- =====================================================
-- MATCHES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all matches" ON matches;

CREATE POLICY "Admins can manage all matches"
  ON matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN divisions d ON d.id = matches.division_id
      LEFT JOIN leagues l ON l.id = d.league_id
      WHERE p.id = auth.uid()
      AND (
        -- Super admin (can manage all matches)
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        -- League admin managing matches in their league
        (p.role = 'league_admin' AND p.managed_league_id = l.id)
      )
    )
  );

-- =====================================================
-- STANDINGS TABLE (if exists)
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage standings" ON standings;

CREATE POLICY "Admins can manage standings"
  ON standings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN divisions d ON d.id = standings.division_id
      LEFT JOIN leagues l ON l.id = d.league_id
      WHERE p.id = auth.uid()
      AND (
        -- Super admin (can manage all standings)
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        -- League admin managing standings in their league
        (p.role = 'league_admin' AND p.managed_league_id = l.id)
      )
    )
  );

-- =====================================================
-- TRANSFERS TABLE (if exists)
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage transfers" ON transfers;

CREATE POLICY "Admins can manage transfers"
  ON transfers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN players pl ON pl.id = transfers.player_id
      LEFT JOIN teams t ON t.id = pl.team_id
      LEFT JOIN divisions d ON d.id = t.division_id
      LEFT JOIN leagues l ON l.id = d.league_id
      WHERE p.id = auth.uid()
      AND (
        -- Super admin (can manage all transfers)
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        -- League admin managing transfers in their league
        (p.role = 'league_admin' AND p.managed_league_id = l.id)
      )
    )
  );

-- Verification query: Check all policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('leagues', 'divisions', 'teams', 'players', 'matches', 'standings', 'transfers')
ORDER BY tablename, policyname;
