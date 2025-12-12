-- DIAGNOSTIC SCRIPT - Check Admin Status
-- Run this to see what's going on with your profile and permissions

-- 1. Check if user exists in auth.users
SELECT
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'admin@liberaleague.com';

-- 2. Check if profile exists
SELECT
  id,
  email,
  role,
  full_name,
  created_at
FROM profiles
WHERE email = 'admin@liberaleague.com';

-- 3. List all profiles to see what's in the table
SELECT
  email,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- 4. Check current RLS policies on profiles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 5. Check RLS policies on ads table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'ads';

-- 6. Check if ads table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'ads'
) as ads_table_exists;

-- 7. Count existing ads
SELECT COUNT(*) as total_ads FROM ads;
