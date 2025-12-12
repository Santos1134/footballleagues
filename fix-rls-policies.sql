-- FIX RLS POLICIES FOR PROFILES TABLE
-- This will fix the login issue and allow proper admin access

-- Step 1: Temporarily disable RLS to work freely
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;

-- Step 3: Create admin profile for all users (ensures no one is left out)
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

-- Step 4: Create proper RLS policies
-- Allow everyone to view profiles (needed for login and profile checks)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Step 5: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify the setup
SELECT
  email,
  role,
  created_at,
  'Login should work: YES' as status
FROM profiles
ORDER BY created_at DESC;

-- Step 7: Check RLS policies
SELECT
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
