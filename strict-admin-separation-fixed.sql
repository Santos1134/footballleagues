-- STRICT ADMIN SEPARATION (FIXED SYNTAX)
-- Cup admins: ZERO access to leagues (can't even manage)
-- League admins: ZERO access to cups (can't even manage)
-- Super admins: Full access to everything

-- =====================================================
-- PART 1: ENABLE PROFILE DELETION FOR SUPER ADMIN
-- =====================================================

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
-- PART 2: LEAGUES - ONLY SUPER ADMINS & LEAGUE ADMINS
-- =====================================================

DROP POLICY IF EXISTS "Leagues are viewable by everyone" ON leagues;
DROP POLICY IF EXISTS "Public can view leagues" ON leagues;
DROP POLICY IF EXISTS "Only admins can manage leagues" ON leagues;
DROP POLICY IF EXISTS "Only super admins can manage leagues" ON leagues;
DROP POLICY IF EXISTS "Admins can update leagues" ON leagues;
DROP POLICY IF EXISTS "Admins can delete leagues" ON leagues;
DROP POLICY IF EXISTS "Admins can manage leagues" ON leagues;
DROP POLICY IF EXISTS "Super admins can insert leagues" ON leagues;

-- Public can view leagues
CREATE POLICY "Public can view leagues"
  ON leagues FOR SELECT
  USING (true);

-- Only super admins can create leagues
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

-- Super admins and league admins can update leagues
CREATE POLICY "Admins can update leagues"
  ON leagues FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        (profiles.role = 'admin' AND profiles.managed_league_id IS NULL AND profiles.managed_cup_id IS NULL) OR
        (profiles.role = 'league_admin' AND profiles.managed_league_id = leagues.id)
      )
      AND profiles.managed_cup_id IS NULL
    )
  );

-- Super admins and league admins can delete leagues
CREATE POLICY "Admins can delete leagues"
  ON leagues FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        (profiles.role = 'admin' AND profiles.managed_league_id IS NULL AND profiles.managed_cup_id IS NULL) OR
        (profiles.role = 'league_admin' AND profiles.managed_league_id = leagues.id)
      )
      AND profiles.managed_cup_id IS NULL
    )
  );

-- =====================================================
-- PART 3: DIVISIONS - ONLY SUPER ADMINS & LEAGUE ADMINS
-- =====================================================

DROP POLICY IF EXISTS "Divisions are viewable by everyone" ON divisions;
DROP POLICY IF EXISTS "Public can view divisions" ON divisions;
DROP POLICY IF EXISTS "Only admins can manage divisions" ON divisions;
DROP POLICY IF EXISTS "Only super admins can manage divisions" ON divisions;
DROP POLICY IF EXISTS "Admins can manage divisions" ON divisions;

CREATE POLICY "Public can view divisions"
  ON divisions FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert divisions"
  ON divisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN leagues l ON l.id = divisions.league_id
      WHERE p.id = auth.uid()
      AND (
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        (p.role = 'league_admin' AND p.managed_league_id = l.id)
      )
      AND p.managed_cup_id IS NULL
    )
  );

CREATE POLICY "Admins can update divisions"
  ON divisions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN leagues l ON l.id = divisions.league_id
      WHERE p.id = auth.uid()
      AND (
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        (p.role = 'league_admin' AND p.managed_league_id = l.id)
      )
      AND p.managed_cup_id IS NULL
    )
  );

CREATE POLICY "Admins can delete divisions"
  ON divisions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN leagues l ON l.id = divisions.league_id
      WHERE p.id = auth.uid()
      AND (
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        (p.role = 'league_admin' AND p.managed_league_id = l.id)
      )
      AND p.managed_cup_id IS NULL
    )
  );

-- =====================================================
-- PART 4: TEAMS - ONLY SUPER ADMINS & LEAGUE ADMINS
-- =====================================================

DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
DROP POLICY IF EXISTS "Public can view teams" ON teams;
DROP POLICY IF EXISTS "Admins can manage all teams" ON teams;
DROP POLICY IF EXISTS "Only super admins can manage teams" ON teams;
DROP POLICY IF EXISTS "Team managers can manage own team" ON teams;
DROP POLICY IF EXISTS "Team managers can update own team" ON teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;

CREATE POLICY "Public can view teams"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN divisions d ON d.id = teams.division_id
      LEFT JOIN leagues l ON l.id = d.league_id
      WHERE p.id = auth.uid()
      AND (
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        (p.role = 'league_admin' AND p.managed_league_id = l.id) OR
        (teams.manager_id = p.id)
      )
      AND p.managed_cup_id IS NULL
    )
  );

-- =====================================================
-- PART 5: PLAYERS - ONLY SUPER ADMINS & LEAGUE ADMINS
-- =====================================================

DROP POLICY IF EXISTS "Players are viewable by everyone" ON players;
DROP POLICY IF EXISTS "Public can view players" ON players;
DROP POLICY IF EXISTS "Admins can manage all players" ON players;
DROP POLICY IF EXISTS "Only super admins can manage players" ON players;
DROP POLICY IF EXISTS "Team managers can manage their players" ON players;
DROP POLICY IF EXISTS "Admins can manage players" ON players;

CREATE POLICY "Public can view players"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage players"
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
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        (p.role = 'league_admin' AND p.managed_league_id = l.id) OR
        (t.manager_id = p.id)
      )
      AND p.managed_cup_id IS NULL
    )
  );

-- =====================================================
-- PART 6: MATCHES - ONLY SUPER ADMINS & LEAGUE ADMINS
-- =====================================================

DROP POLICY IF EXISTS "Matches are viewable by everyone" ON matches;
DROP POLICY IF EXISTS "Public can view matches" ON matches;
DROP POLICY IF EXISTS "Admins can manage all matches" ON matches;
DROP POLICY IF EXISTS "Only super admins can manage matches" ON matches;
DROP POLICY IF EXISTS "Admins can manage matches" ON matches;

CREATE POLICY "Public can view matches"
  ON matches FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage matches"
  ON matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN divisions d ON d.id = matches.division_id
      LEFT JOIN leagues l ON l.id = d.league_id
      WHERE p.id = auth.uid()
      AND (
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        (p.role = 'league_admin' AND p.managed_league_id = l.id)
      )
      AND p.managed_cup_id IS NULL
    )
  );

-- =====================================================
-- PART 7: CUPS - ONLY SUPER ADMINS & CUP ADMINS
-- =====================================================

DROP POLICY IF EXISTS "Cups are viewable by everyone" ON cups;
DROP POLICY IF EXISTS "Public can view cups" ON cups;
DROP POLICY IF EXISTS "Admins can insert cups" ON cups;
DROP POLICY IF EXISTS "Admins can update cups" ON cups;
DROP POLICY IF EXISTS "Admins can delete cups" ON cups;
DROP POLICY IF EXISTS "Admins can manage cups" ON cups;
DROP POLICY IF EXISTS "Super admins can insert cups" ON cups;

CREATE POLICY "Public can view cups"
  ON cups FOR SELECT
  USING (true);

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
      AND profiles.managed_league_id IS NULL
    )
  );

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
      AND profiles.managed_league_id IS NULL
    )
  );

-- =====================================================
-- PART 8: CUP_GROUPS - ONLY SUPER ADMINS & CUP ADMINS
-- =====================================================

DROP POLICY IF EXISTS "Cup groups are viewable by everyone" ON cup_groups;
DROP POLICY IF EXISTS "Public can view cup groups" ON cup_groups;
DROP POLICY IF EXISTS "Admins can manage cup groups" ON cup_groups;

CREATE POLICY "Public can view cup groups"
  ON cup_groups FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage cup groups"
  ON cup_groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN cups c ON c.id = cup_groups.cup_id
      WHERE p.id = auth.uid()
      AND (
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        (p.role = 'league_admin' AND p.managed_cup_id = c.id)
      )
      AND p.managed_league_id IS NULL
    )
  );

-- =====================================================
-- PART 9: CUP_TEAMS - ONLY SUPER ADMINS & CUP ADMINS
-- =====================================================

DROP POLICY IF EXISTS "Cup teams are viewable by everyone" ON cup_teams;
DROP POLICY IF EXISTS "Public can view cup teams" ON cup_teams;
DROP POLICY IF EXISTS "Admins can manage cup teams" ON cup_teams;

CREATE POLICY "Public can view cup teams"
  ON cup_teams FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage cup teams"
  ON cup_teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN cups c ON c.id = cup_teams.cup_id
      WHERE p.id = auth.uid()
      AND (
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        (p.role = 'league_admin' AND p.managed_cup_id = c.id)
      )
      AND p.managed_league_id IS NULL
    )
  );

-- =====================================================
-- PART 10: CUP_MATCHES - ONLY SUPER ADMINS & CUP ADMINS
-- =====================================================

DROP POLICY IF EXISTS "Cup matches are viewable by everyone" ON cup_matches;
DROP POLICY IF EXISTS "Public can view cup matches" ON cup_matches;
DROP POLICY IF EXISTS "Admins can manage cup matches" ON cup_matches;

CREATE POLICY "Public can view cup matches"
  ON cup_matches FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage cup matches"
  ON cup_matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN cups c ON c.id = cup_matches.cup_id
      WHERE p.id = auth.uid()
      AND (
        (p.role = 'admin' AND p.managed_league_id IS NULL AND p.managed_cup_id IS NULL) OR
        (p.role = 'league_admin' AND p.managed_cup_id = c.id)
      )
      AND p.managed_league_id IS NULL
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show all admins and their assignments
SELECT
  email,
  role,
  managed_league_id,
  managed_cup_id,
  CASE
    WHEN managed_league_id IS NOT NULL THEN 'League Admin - NO cup access'
    WHEN managed_cup_id IS NOT NULL THEN 'Cup Admin - NO league access'
    WHEN role = 'admin' THEN 'Super Admin - Full access'
    ELSE 'No Assignment'
  END as admin_type
FROM profiles
WHERE role IN ('admin', 'league_admin')
ORDER BY created_at DESC;

-- Show all policies created
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
