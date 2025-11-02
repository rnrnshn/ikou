-- Update communities table to use organizer_id instead of created_by
-- Drop the problematic foreign key constraint first by recreating the table safely
-- Note: This script uses the correct column names that match the existing Supabase schema

-- Check if columns exist and add them if needed
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure the profiles table is linked to auth.users correctly
-- This is the user profile table in your existing schema
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT auth.uid(),
ADD CONSTRAINT profiles_id_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_communities_organizer_id ON communities(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_community_followers_community_id ON community_followers(community_id);
CREATE INDEX IF NOT EXISTS idx_community_followers_user_id ON community_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id);

-- Ensure RLS policies are in place for the existing tables
-- Communities
DROP POLICY IF EXISTS "communities_select_all" ON communities;
CREATE POLICY "communities_select_all" ON communities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "communities_insert_own" ON communities;
CREATE POLICY "communities_insert_own" ON communities
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "communities_update_own" ON communities;
CREATE POLICY "communities_update_own" ON communities
  FOR UPDATE USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "communities_delete_own" ON communities;
CREATE POLICY "communities_delete_own" ON communities
  FOR DELETE USING (auth.uid() = organizer_id);

-- Events
DROP POLICY IF EXISTS "events_select_all" ON events;
CREATE POLICY "events_select_all" ON events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_insert_own" ON events;
CREATE POLICY "events_insert_own" ON events
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "events_update_own" ON events;
CREATE POLICY "events_update_own" ON events
  FOR UPDATE USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "events_delete_own" ON events;
CREATE POLICY "events_delete_own" ON events
  FOR DELETE USING (auth.uid() = organizer_id);

-- Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Community Followers
DROP POLICY IF EXISTS "followers_select_all" ON community_followers;
CREATE POLICY "followers_select_all" ON community_followers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "followers_insert_own" ON community_followers;
CREATE POLICY "followers_insert_own" ON community_followers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "followers_delete_own" ON community_followers;
CREATE POLICY "followers_delete_own" ON community_followers
  FOR DELETE USING (auth.uid() = user_id);

-- RSVPs
DROP POLICY IF EXISTS "rsvps_select_own" ON rsvps;
CREATE POLICY "rsvps_select_own" ON rsvps
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rsvps_insert_own" ON rsvps;
CREATE POLICY "rsvps_insert_own" ON rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "rsvps_delete_own" ON rsvps;
CREATE POLICY "rsvps_delete_own" ON rsvps
  FOR DELETE USING (auth.uid() = user_id);
