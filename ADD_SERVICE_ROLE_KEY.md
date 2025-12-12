# Add Supabase Service Role Key to Vercel

The cup/league admin creation feature is failing because the `SUPABASE_SERVICE_ROLE_KEY` environment variable is not set in your Vercel production environment.

## Steps to Fix:

### 1. Get Your Service Role Key from Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **Settings** (gear icon in left sidebar)
4. Click on **API**
5. Scroll down to **Project API keys**
6. Find the **service_role** key (⚠️ This is secret - never expose it publicly!)
7. Click the eye icon to reveal it
8. Copy the entire key

### 2. Add to Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project: **local-league**
3. Click **Settings** tab
4. Click **Environment Variables** in the left menu
5. Click **Add New** button
6. Fill in:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Paste the service_role key you copied from Supabase
   - **Environment**: Select **Production**, **Preview**, and **Development** (check all three)
7. Click **Save**

### 3. Redeploy Your Application

After adding the environment variable, you need to redeploy:

**Option A - Via Vercel Dashboard:**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the three dots menu (...)
4. Click **Redeploy**

**Option B - Via Command Line:**
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin main
```

### 4. Test Cup Admin Creation

After redeployment completes:

1. Go to https://liberialeagues.com/admin/administrators
2. Try creating a cup admin
3. It should now work without the "Missing environment variables" error

## Security Notes

⚠️ **IMPORTANT**:
- The service_role key has **full database access** and **bypasses all RLS policies**
- NEVER commit this key to git or expose it in client-side code
- Only use it in server-side API routes (like `/api/admin/create-user/route.ts`)
- The key is only used to create admin profiles, which requires bypassing RLS

## What This Key Is Used For

The `SUPABASE_SERVICE_ROLE_KEY` is needed to:
1. Create profiles with `league_admin` role
2. Assign `managed_league_id` or `managed_cup_id` to admins
3. Bypass RLS policies that would normally prevent profile creation

Without it, the API route can't create admin users because regular authenticated users don't have permission to set admin roles.
