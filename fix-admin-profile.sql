-- Fix Admin Profile Creation Issue
-- This script adds the missing INSERT policy and creates the admin profile

-- Step 1: Add INSERT policy to profiles table (this was missing!)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Step 2: Add a policy allowing service role to insert profiles
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Step 3: Check if profile exists for the current user
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM auth.users
  WHERE id = auth.uid();

  RAISE NOTICE 'Found % users with ID matching auth.uid()', user_count;
END $$;

-- Step 4: Get user information from auth.users
SELECT
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
WHERE id = auth.uid();

-- Step 5: Check existing profiles
SELECT id, email, role FROM profiles;

-- Step 6: Insert profile with admin role
-- This uses the service_role context to bypass RLS
INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
SELECT
  id,
  email,
  'admin'::user_role,
  COALESCE(raw_user_meta_data->>'full_name', email),
  NOW(),
  NOW()
FROM auth.users
WHERE id = auth.uid()
ON CONFLICT (id) DO UPDATE
SET role = 'admin'::user_role,
    updated_at = NOW();

-- Step 7: Verify the profile was created
SELECT id, email, role, created_at FROM profiles WHERE id = auth.uid();

-- Step 8: Show all profiles
SELECT email, role, created_at FROM profiles ORDER BY created_at DESC;
