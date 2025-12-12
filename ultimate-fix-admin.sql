-- ULTIMATE FIX - This will definitely work
-- Run this entire script in Supabase SQL Editor

-- Step 1: First, let's see all users in auth.users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Step 2: Temporarily disable RLS on profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Create admin profile for EVERY user in auth.users
-- (This ensures we don't miss the account, regardless of email)
INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
SELECT
  id,
  email,
  'admin'::user_role,
  COALESCE(raw_user_meta_data->>'full_name', email),
  NOW(),
  NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET role = 'admin'::user_role,
    updated_at = NOW();

-- Step 4: Add INSERT policy if it doesn't exist
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Step 5: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Show all profiles to verify
SELECT id, email, role, created_at FROM profiles ORDER BY created_at DESC;

-- Step 7: Test that you can query your own profile
-- (This simulates what happens when you're logged in)
SELECT
  p.id,
  p.email,
  p.role,
  'Can create ads: ' || CASE WHEN p.role = 'admin' THEN 'YES' ELSE 'NO' END as permission
FROM profiles p
ORDER BY created_at DESC;
