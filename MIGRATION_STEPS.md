# Database Migration - Step by Step

⚠️ **IMPORTANT:** These migrations must be run in **TWO SEPARATE STEPS** due to PostgreSQL enum constraints.

## Step 1: Add Enum Value

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard)
2. Click **New Query**
3. Copy and paste the **entire contents** of:
   ```
   supabase/migrations/01_add_league_admin_enum.sql
   ```
4. Click **Run** (Ctrl/Cmd + Enter)
5. ✅ You should see: "Success. No rows returned"

## Step 2: Create Tables and Policies

1. In Supabase SQL Editor, click **New Query** again
2. Copy and paste the **entire contents** of:
   ```
   supabase/migrations/create_cups_and_league_admins.sql
   ```
3. Click **Run** (Ctrl/Cmd + Enter)
4. ✅ You should see: "Success. No rows returned"

## Verify Migration

Run this query to verify everything was created:

```sql
-- Check enum value
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumlabel;

-- Should see: admin, fan, league_admin, player, team_manager

-- Check new column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'managed_league_id';

-- Should see: managed_league_id | uuid

-- Check new tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('cups', 'cup_groups', 'cup_teams', 'cup_matches');

-- Should see all 4 tables
```

## Why Two Steps?

PostgreSQL requires new enum values to be committed in a separate transaction before they can be used. Running them together causes the error:

```
ERROR: unsafe use of new value "league_admin" of enum type user_role
```

By splitting into two migrations and running them separately, each gets its own transaction and the enum value is properly committed before being used.

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
**Solution:** The enum already exists. Skip Step 1 and go directly to Step 2.

### Error: "column 'managed_league_id' already exists"
**Solution:** The migration was partially run. You can:
1. Drop the column: `ALTER TABLE profiles DROP COLUMN managed_league_id;`
2. Re-run Step 2

### Error: "relation 'cups' already exists"
**Solution:** Tables were already created. Either:
1. Continue using them (they're ready!)
2. Or drop and recreate:
```sql
DROP TABLE IF EXISTS cup_matches CASCADE;
DROP TABLE IF EXISTS cup_teams CASCADE;
DROP TABLE IF EXISTS cup_groups CASCADE;
DROP TABLE IF EXISTS cups CASCADE;
```
Then re-run Step 2.

---

**After successful migration, you're ready to use the new features!**

Go to `/admin/cups` to create your first tournament! 🏆
