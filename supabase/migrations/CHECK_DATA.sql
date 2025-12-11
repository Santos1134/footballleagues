-- Quick check to see what data exists in your database

-- Check leagues
SELECT 'LEAGUES' as table_name, COUNT(*) as total_count, COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM leagues;

-- Check divisions
SELECT 'DIVISIONS' as table_name, COUNT(*) as total_count
FROM divisions;

-- Check teams (from leagues)
SELECT 'TEAMS (League)' as table_name, COUNT(*) as total_count
FROM teams;

-- Check cup_teams_registry (from cups)
SELECT 'TEAMS (Cup)' as table_name, COUNT(*) as total_count
FROM cup_teams_registry;

-- Check players
SELECT 'PLAYERS' as table_name, COUNT(*) as total_count
FROM players;

-- Check cups
SELECT 'CUPS' as table_name, COUNT(*) as total_count, COUNT(*) FILTER (WHERE status = 'active') as active_count
FROM cups;

-- Show actual team names if any exist
SELECT 'League Teams:' as info, name FROM teams ORDER BY name;
SELECT 'Cup Teams:' as info, name FROM cup_teams_registry ORDER BY name;
