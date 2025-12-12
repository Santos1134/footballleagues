-- SIMPLE FIX FOR ADMIN PROFILE
-- Run this in Supabase SQL Editor

-- Step 1: Add missing INSERT policy to profiles table
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Step 2: Temporarily disable RLS to create the admin profile
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Find your user ID and create admin profile
INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
SELECT
  id,
  email,
  'admin'::user_role,
  COALESCE(raw_user_meta_data->>'full_name', email),
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@liberaleague.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin'::user_role,
    updated_at = NOW();

-- Step 4: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify it worked
SELECT id, email, role, created_at FROM profiles WHERE email = 'admin@liberaleague.com';
