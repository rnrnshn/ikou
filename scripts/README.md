# Database Schema Management Scripts

This directory contains SQL migration scripts and verification tools for the Ikou database.

---

## 📋 Current Database Status

**Schema Status**: ⚠️ **Needs Schema Fix**

The application code requires specific tables that may not be in your current schema.

### ✅ Required Tables (Application Code Depends On These)
- `profiles` - User accounts with roles (linked to auth.users)
- `communities` - Community metadata with `organizer_id`
- `events` - Event details with `organizer_id`
- `community_members` - Community membership with role tracking (member/moderator/admin)
- `event_attendees` - Event RSVPs with status tracking (attending/interested/declined)

### 🔧 What the Fix Does
The unified schema fix (`08-unified-schema-fix.sql`) ensures your database has all the tables the application expects:
- Creates `community_members` table (with role-based access)
- Creates `event_attendees` table (with status tracking)
- Adds auto-counting triggers for member_count and attendee_count
- Ensures all tables reference `profiles` (not `users`)

---

## 🚀 Quick Start - Fix Your Database

### Step 1: Run the Unified Schema Fix

Navigate to your Supabase dashboard and execute the fix script:

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `08-unified-schema-fix.sql`
4. Click **Run** or press `Ctrl/Cmd + Enter`

**What it does**: Creates all required tables (`community_members`, `event_attendees`) with proper RLS policies and triggers.

**This script is safe to run multiple times** - it won't duplicate tables or data.

### Step 2: Verify Schema

Run the verification script from your terminal:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://jpixrjaostgngicmymht.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here \
node scripts/verify-schema.js
```

Or use your `.env` file values (requires dotenv or running through Next.js):

```bash
npm run verify-db  # (if you add this script to package.json)
```

**Expected output**:
```
✅ Checking Required Tables:
✅ profiles                  - EXISTS
✅ communities               - EXISTS
✅ events                    - EXISTS
✅ rsvps                     - EXISTS
✅ community_followers       - EXISTS

⚠️  Checking Forbidden Tables (should NOT exist):
✅ users                     - Does NOT exist (good!)
✅ event_attendees           - Does NOT exist (good!)
✅ community_members         - Does NOT exist (good!)

✅ SCHEMA VERIFICATION PASSED
```

---

## 📁 File Overview

### SQL Migration Files

| File | Status | Description |
|------|--------|-------------|
| `001_initial_schema.sql` | ✅ **CORRECT** | The proper schema with `profiles`, `organizer_id`, and all RLS policies |
| `01-init-schema.sql` | ❌ **WRONG** | Old schema using `users` and `created_by` (ignore this) |
| `02-fix-schema.sql` | ⚠️ **PATCH** | Attempted fix for mixed schema (not needed after cleanup) |
| `03-cleanup-duplicate-tables.sql` | 🔧 **CLEANUP** | **USE THIS** to remove duplicate tables |

### Verification Scripts

| File | Purpose |
|------|---------|
| `check-db-state.js` | Check which tables currently exist in database |
| `verify-schema.js` | Verify schema is correct after cleanup |

---

## 🔍 Detailed Schema Information

### The Correct Schema (001_initial_schema.sql)

#### Tables Structure

**profiles**
```sql
- id (uuid, pk, references auth.users)
- name (text, required)
- email (text, unique, required)
- role (text: 'member', 'organizer', 'admin')
- city (text, optional)
- bio (text, optional)
- avatar_url (text, optional)
- created_at, updated_at
```

**communities**
```sql
- id (uuid, pk)
- name (text, required)
- description (text, required)
- category (text, required)
- city (text, required)
- image_url (text, optional)
- organizer_id (uuid, fk → profiles.id) ⭐
- created_at, updated_at
```

**events**
```sql
- id (uuid, pk)
- title (text, required)
- description (text, required)
- community_id (uuid, fk → communities.id)
- organizer_id (uuid, fk → profiles.id) ⭐
- event_date (timestamptz, required)
- duration_hours (integer, required)
- venue_name (text, required)
- address (text, required)
- city (text, required)
- is_online (boolean)
- max_attendees (integer, optional)
- image_url (text, optional)
- status (text: 'upcoming', 'past', 'cancelled')
- created_at, updated_at
```

**rsvps**
```sql
- id (uuid, pk)
- event_id (uuid, fk → events.id)
- user_id (uuid, fk → profiles.id)
- created_at
- UNIQUE(event_id, user_id)
```

**community_followers**
```sql
- id (uuid, pk)
- community_id (uuid, fk → communities.id)
- user_id (uuid, fk → profiles.id)
- created_at
- UNIQUE(community_id, user_id)
```

#### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

**Profiles**
- Users can SELECT, INSERT, UPDATE, DELETE their own profile

**Communities**
- All users can SELECT (public read)
- Users can INSERT if authenticated and `organizer_id = auth.uid()`
- Users can UPDATE/DELETE their own communities

**Events**
- All users can SELECT (public read)
- Users can INSERT if authenticated and `organizer_id = auth.uid()`
- Users can UPDATE/DELETE their own events

**RSVPs**
- All users can SELECT (public read)
- Users can INSERT/DELETE their own RSVPs

**Community Followers**
- All users can SELECT (public read)
- Users can INSERT/DELETE their own follows

#### Triggers

**Auto-create profile on signup**
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

This automatically creates a profile when a user signs up via Supabase Auth.

---

## 🛠️ Troubleshooting

### Issue: Script says tables don't exist
**Solution**: You may need to run `001_initial_schema.sql` first if you have a completely fresh database.

### Issue: Cleanup script fails with foreign key errors
**Solution**: The script handles CASCADE deletes automatically. If it fails, ensure you're running the entire script as one transaction.

### Issue: App shows "relation does not exist" errors
**Possible causes**:
1. Schema not applied yet → Run `001_initial_schema.sql`
2. Wrong table names in app code → Ensure app uses `profiles`, `rsvps`, etc.
3. RLS blocking queries → Check RLS policies are correct

### Issue: Can't authenticate or create profiles
**Solution**: Ensure the `handle_new_user()` trigger is installed. Check in Supabase Dashboard → Database → Triggers.

---

## 📝 Next Steps After Cleanup

Once your database is clean:

1. ✅ **Test Authentication**
   - Sign up a test user
   - Verify profile is auto-created in `profiles` table
   - Check role defaults to 'member'

2. ✅ **Test Dashboard**
   - Create a community (as organizer)
   - Create an event
   - Verify `organizer_id` is set correctly

3. ✅ **Build Authentication** (Phase 1 - High Priority)
   - Login page
   - Signup page with role selection
   - Protected routes middleware

4. ✅ **Update PROJECT.md**
   - Mark database schema as fixed ✅
   - Update status to unblocked

---

## 🔗 Useful Commands

### Check Database State
```bash
node scripts/check-db-state.js
```

### Verify Schema
```bash
node scripts/verify-schema.js
```

### Run Supabase CLI (if installed)
```bash
supabase db push       # Push local migrations
supabase db diff       # Check schema differences
supabase db reset      # Reset database (destructive!)
```

---

## ⚠️ Deprecated Scripts - DO NOT RUN

### ❌ 03-cleanup-duplicate-tables.sql
**Status**: DEPRECATED - DO NOT USE

This script was created based on incorrect assumptions about the schema. It attempts to drop `event_attendees` and `community_members` tables, which are actually REQUIRED by the application code.

**DO NOT RUN THIS SCRIPT** - it will break the application.

**Use instead**: `08-unified-schema-fix.sql`

### ❌ 07-create-event-attendees.sql
**Status**: SUPERSEDED by 08-unified-schema-fix.sql

This script is now included in the unified fix. You can use the unified fix instead.

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Verify RLS policies in Dashboard → Database → Policies
3. Check table structure in Dashboard → Table Editor
4. Review error messages in browser console

---

**Last Updated**: November 4, 2025
**Database URL**: `https://jpixrjaostgngicmymht.supabase.co`
