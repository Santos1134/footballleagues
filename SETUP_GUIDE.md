# Setup and Testing Guide - New Features

## Overview

This guide covers the setup and testing of two major new features:
1. **Cup/Tournament System** with automatic group generation
2. **League-Specific Admin Accounts** for delegated management

---

## 🗄️ Database Migration

### Step 1: Run the Migration

You need to run the SQL migration to create the necessary tables and update the profiles table.

**Option A: Using Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/create_cups_and_league_admins.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Ctrl/Cmd + Enter)

**Option B: Using Supabase CLI**
```bash
cd "c:\Users\sumom\Desktop\Local league"
supabase db push
```

### Step 2: Verify Tables Created

Run this query in SQL Editor to verify:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('cups', 'cup_groups', 'cup_teams', 'cup_matches');
```

You should see all 4 tables listed.

### Step 3: Verify Profile Column Added

Run this query:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'managed_league_id';
```

You should see the `managed_league_id` column.

---

## 🧪 Testing Guide

### Part 1: Cup/Tournament System

#### Test 1: Create a Cup Competition

1. **Navigate to Cups**
   - Log in as super admin
   - Go to `/admin/cups`
   - Click "Create New Cup"

2. **Fill in Cup Details**
   - Cup Name: "Test Cup 2024"
   - League: Select any league
   - Description: "Test tournament"
   - Total Teams: 15
   - Teams per Group: 4
   - Season: "2024/25"

3. **Verify Group Distribution Preview**
   - Should show: "4 groups: 3 groups of 4 teams + 1 group of 3 teams"
   - This confirms the grouping logic works correctly

4. **Submit Form**
   - Click "Create Cup"
   - Should redirect to cup details page

#### Test 2: Add Teams to Cup

1. **On Cup Details Page**
   - You should see:
     - "0 / 15 teams" counter
     - Empty team list on right
     - Available teams on left

2. **Select Teams**
   - Use checkboxes to select teams
   - Notice the "Add X Teams" button appears
   - Can use search to filter teams

3. **Add Teams**
   - Select 15 teams total
   - Click "Add X Teams"
   - Verify teams appear in "Cup Teams" section

4. **Test Validation**
   - Try to add more than 15 teams
   - Should show error: "Cannot add X teams. Maximum is 15..."

#### Test 3: Generate Groups

1. **Once 15 Teams Added**
   - "Generate Groups" button should appear
   - Click it
   - Confirm the dialog

2. **Verify Groups Created**
   - Should see 4 groups displayed
   - Group A, B, C each have 4 teams
   - Group D has 3 teams
   - Teams should be randomly distributed

3. **Verify in Database**
   ```sql
   SELECT g.group_name, COUNT(ct.id) as team_count
   FROM cup_groups g
   LEFT JOIN cup_teams ct ON ct.group_id = g.id
   WHERE g.cup_id = 'YOUR_CUP_ID'
   GROUP BY g.id, g.group_name
   ORDER BY g.group_order;
   ```

#### Test 4: Remove Team

1. **In Cup Teams Section**
   - Click "Remove" on any team
   - Confirm dialog
   - Team should be removed
   - Groups should be regenerated if you want to rebalance

#### Test 5: Edit Cup

1. **Go Back to `/admin/cups`**
   - Click "Edit" on your test cup
   - Change total teams to 16
   - Change teams per group to 4
   - Save
   - Preview should show: "4 groups of 4 teams"

#### Test 6: Different Group Scenarios

Test these scenarios to verify grouping logic:

| Total Teams | Per Group | Expected Result |
|-------------|-----------|-----------------|
| 16 | 4 | 4 groups of 4 teams |
| 15 | 4 | 3 groups of 4 teams + 1 group of 3 teams |
| 12 | 3 | 4 groups of 3 teams |
| 10 | 4 | 2 groups of 4 teams + 1 group of 2 teams |
| 8 | 3 | 2 groups of 3 teams + 1 group of 2 teams |

### Part 2: League Admin System

#### Test 1: Create League Admin

1. **Navigate to League Admins**
   - Go to `/admin/league-admins`
   - Only super admins should see this page
   - Click "Create League Admin"

2. **Fill in Form**
   - Email: `testadmin@example.com`
   - Full Name: "Test Admin"
   - Password: `test123456`
   - Assigned League: Select a league
   - Click "Create League Admin"

3. **Verify Success**
   - Should see success message
   - New admin should appear in the list
   - Should show assigned league name

4. **Verify in Database**
   ```sql
   SELECT id, email, full_name, role, managed_league_id
   FROM profiles
   WHERE email = 'testadmin@example.com';
   ```
   - role should be 'league_admin'
   - managed_league_id should match selected league

#### Test 2: Test League Admin Login

1. **Log Out**
   - Log out from super admin account

2. **Log In as League Admin**
   - Email: `testadmin@example.com`
   - Password: `test123456`

3. **Verify Access**
   - Should be able to access `/admin` dashboard
   - Should NOT see "League Admins" quick action
   - Should see all other admin features

4. **Test Permissions**
   - Try to create a cup for assigned league: ✅ Should work
   - Try to manage teams in assigned league: ✅ Should work
   - Try to manage divisions in assigned league: ✅ Should work

#### Test 3: Test League Isolation

1. **As League Admin**
   - Try to access cups from other leagues
   - Try to access teams from other leagues
   - Should only see data for assigned league

2. **Verify Database Policies**
   - RLS policies should prevent access to other leagues
   - Test by trying to view another league's data

#### Test 4: Reassign League

1. **Log Back as Super Admin**

2. **Change League Assignment**
   - Go to `/admin/league-admins`
   - Use dropdown to reassign admin to different league
   - Verify update success

3. **Log Back as League Admin**
   - Should now only see data from new assigned league

#### Test 5: Remove Admin Access

1. **As Super Admin**
   - Go to `/admin/league-admins`
   - Click "Remove Access" for test admin
   - Confirm dialog

2. **Verify**
   - Admin should disappear from list
   - Database check:
   ```sql
   SELECT role, managed_league_id
   FROM profiles
   WHERE email = 'testadmin@example.com';
   ```
   - role should be 'fan'
   - managed_league_id should be NULL

3. **Try to Log In as Former Admin**
   - Should not have access to `/admin` pages
   - Should be redirected to home

---

## 🔍 Key Features to Test

### HCI Principles Implementation

#### 1. **Visibility** ✅
- Group distribution preview shows immediately
- Team counters update in real-time
- Clear status indicators for cups (draft, group_stage, etc.)

#### 2. **Feedback** ✅
- Success/error messages after every action
- Confirmation dialogs for destructive actions
- Loading states during data fetches

#### 3. **Constraints** ✅
- Cannot add more teams than cup maximum
- Cannot generate groups until exact team count reached
- Form validation prevents invalid submissions

#### 4. **Consistency** ✅
- Same UI patterns across all admin pages
- Consistent color scheme (Liberian colors)
- Uniform card layouts and button styles

#### 5. **Error Prevention** ✅
- Confirmation dialogs before deletions
- Validation messages guide correct input
- Disabled states prevent premature actions

#### 6. **Recognition vs Recall** ✅
- Dropdowns show all available options
- Clear labels and descriptions
- Info banners explain complex features

---

## 🎨 UI/UX Validation

### Visual Consistency
- [ ] All buttons use Liberian colors (blue/red)
- [ ] Forms have proper spacing and alignment
- [ ] Cards have consistent shadow and border styles
- [ ] Icons are clear and meaningful

### Responsive Design
- [ ] Test on mobile (320px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] All forms stack properly on mobile

### Accessibility
- [ ] All form inputs have labels
- [ ] Buttons have clear text
- [ ] Color contrast is sufficient
- [ ] Focus states are visible

---

## ⚠️ Common Issues and Solutions

### Issue 1: Migration Fails

**Symptoms:** Error when running SQL migration

**Solutions:**
1. Check if `update_updated_at_column()` function already exists
2. Run this first if needed:
   ```sql
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = TIMEZONE('utc'::text, NOW());
     RETURN NEW;
   END;
   $$ language 'plpgsql';
   ```

### Issue 2: Cannot Create League Admin

**Symptoms:** "Email already exists" or auth error

**Solutions:**
1. Check if email is unique in database
2. Verify Supabase auth settings allow signups
3. May need to use Supabase service role for admin creation

### Issue 3: League Admin Cannot Access Pages

**Symptoms:** Redirected to home page

**Solutions:**
1. Verify role is set to 'league_admin' in database
2. Check managed_league_id is not NULL
3. Clear browser cookies and re-login

### Issue 4: Groups Not Generating

**Symptoms:** Nothing happens when clicking "Generate Groups"

**Solutions:**
1. Verify exact team count matches cup total_teams
2. Check browser console for errors
3. Verify RLS policies allow group creation

---

## 📊 Database Queries for Testing

### View All Cups
```sql
SELECT c.*, l.name as league_name
FROM cups c
LEFT JOIN leagues l ON l.id = c.league_id
ORDER BY c.created_at DESC;
```

### View Cup with Teams and Groups
```sql
SELECT
  c.name as cup_name,
  g.group_name,
  t.name as team_name
FROM cups c
LEFT JOIN cup_groups g ON g.cup_id = c.id
LEFT JOIN cup_teams ct ON ct.cup_id = c.id AND ct.group_id = g.id
LEFT JOIN teams t ON t.id = ct.team_id
WHERE c.id = 'YOUR_CUP_ID'
ORDER BY g.group_order, t.name;
```

### View All League Admins
```sql
SELECT
  p.email,
  p.full_name,
  p.role,
  l.name as managed_league
FROM profiles p
LEFT JOIN leagues l ON l.id = p.managed_league_id
WHERE p.role = 'league_admin'
ORDER BY p.created_at DESC;
```

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('cups', 'cup_groups', 'cup_teams', 'cup_matches')
ORDER BY tablename, policyname;
```

---

## ✅ Final Checklist Before Going Live

### Database
- [ ] Migration ran successfully
- [ ] All 4 cup tables exist
- [ ] Profile table has managed_league_id column
- [ ] RLS policies are enabled
- [ ] Test queries return expected results

### Cups Feature
- [ ] Can create cup
- [ ] Can add teams
- [ ] Group distribution calculates correctly
- [ ] Can generate groups
- [ ] Teams distribute randomly
- [ ] Can edit cup details
- [ ] Can delete cup (cascades properly)

### League Admin Feature
- [ ] Can create league admin account
- [ ] League admin can login
- [ ] League admin sees only their league
- [ ] Super admin can reassign leagues
- [ ] Super admin can remove admin access
- [ ] League Admins menu hidden from league admins

### UI/UX
- [ ] All forms validate properly
- [ ] Success/error messages display
- [ ] Confirmation dialogs work
- [ ] Loading states show
- [ ] Responsive on all devices
- [ ] Colors and styling consistent

### Security
- [ ] League admins cannot access other leagues
- [ ] League admins cannot create other admins
- [ ] RLS prevents unauthorized data access
- [ ] Form inputs are sanitized

---

## 🚀 Ready to Push

Once all tests pass and checklist is complete:

```bash
git add .
git commit -m "Add cup competitions and league admin system

Features:
- Cup/tournament system with automatic group generation
- Intelligent grouping algorithm (handles uneven team counts)
- League-specific admin accounts for delegated management
- Role-based access control
- Full CRUD operations for cups and groups
- Professional UI following HCI principles
- Removed sponsorship pages"

git push origin main
```

Your Netlify deployment will automatically update!

---

## 📞 Support

If you encounter any issues during testing:
1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify RLS policies in Supabase dashboard
4. Review this guide's "Common Issues" section

---

**Created:** December 2024
**Platform:** Liberia Division League Management System
**Features:** Cup Competitions + League Admin System
