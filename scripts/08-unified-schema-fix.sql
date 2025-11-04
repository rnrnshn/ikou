-- =============================================================================
-- UNIFIED SCHEMA FIX
-- =============================================================================
-- This script creates the correct tables that the application code expects
-- while ensuring compatibility with the profiles table (not users table)
--
-- Tables created:
--   1. community_members (for managing community membership with roles)
--   2. event_attendees (for managing event RSVPs with status tracking)
--
-- This script is safe to run multiple times (idempotent)
-- =============================================================================

-- =============================================================================
-- 1. CREATE COMMUNITY_MEMBERS TABLE
-- =============================================================================
-- This table manages community membership with role-based access
-- Replaces: community_followers (which doesn't have role tracking)

CREATE TABLE IF NOT EXISTS community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS for community_members
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "community_members_select_all" ON community_members;
DROP POLICY IF EXISTS "community_members_insert_own" ON community_members;
DROP POLICY IF EXISTS "community_members_update_own" ON community_members;
DROP POLICY IF EXISTS "community_members_delete_own" ON community_members;
DROP POLICY IF EXISTS "community_members_delete_organizer" ON community_members;

-- RLS Policies for community_members
-- Anyone can view community members
CREATE POLICY "community_members_select_all" ON community_members
  FOR SELECT USING (true);

-- Users can join communities
CREATE POLICY "community_members_insert_own" ON community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own membership
CREATE POLICY "community_members_update_own" ON community_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can leave communities
CREATE POLICY "community_members_delete_own" ON community_members
  FOR DELETE USING (auth.uid() = user_id);

-- Community organizers can remove members
CREATE POLICY "community_members_delete_organizer" ON community_members
  FOR DELETE USING (
    auth.uid() IN (
      SELECT organizer_id FROM communities WHERE id = community_id
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(role);

-- =============================================================================
-- 2. CREATE EVENT_ATTENDEES TABLE
-- =============================================================================
-- This table manages event RSVPs with detailed status tracking
-- Replaces: rsvps (which doesn't have status tracking)

-- Only create if it doesn't exist (script 07 may have already created it)
CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'attending' CHECK (status IN ('attending', 'interested', 'declined')),
  registered_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS for event_attendees
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "event_attendees_select_all" ON event_attendees;
DROP POLICY IF EXISTS "event_attendees_insert_own" ON event_attendees;
DROP POLICY IF EXISTS "event_attendees_update_own" ON event_attendees;
DROP POLICY IF EXISTS "event_attendees_delete_own" ON event_attendees;
DROP POLICY IF EXISTS "event_attendees_delete_organizer" ON event_attendees;

-- RLS Policies for event_attendees
-- Anyone can view event attendees
CREATE POLICY "event_attendees_select_all" ON event_attendees
  FOR SELECT USING (true);

-- Users can register for events
CREATE POLICY "event_attendees_insert_own" ON event_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own attendance status
CREATE POLICY "event_attendees_update_own" ON event_attendees
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can cancel their own attendance
CREATE POLICY "event_attendees_delete_own" ON event_attendees
  FOR DELETE USING (auth.uid() = user_id);

-- Event organizers can remove attendees
CREATE POLICY "event_attendees_delete_organizer" ON event_attendees
  FOR DELETE USING (
    auth.uid() IN (
      SELECT organizer_id FROM events WHERE id = event_id
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_status ON event_attendees(status);

-- =============================================================================
-- 3. CREATE TRIGGERS FOR AUTO-UPDATING COUNTS
-- =============================================================================

-- Function to update community member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
  SET member_count = (
    SELECT COUNT(*)
    FROM community_members
    WHERE community_id = COALESCE(NEW.community_id, OLD.community_id)
  )
  WHERE id = COALESCE(NEW.community_id, OLD.community_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update event attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET attendee_count = (
    SELECT COUNT(*)
    FROM event_attendees
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
    AND status = 'attending'
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_community_member_count_trigger ON community_members;
DROP TRIGGER IF EXISTS update_event_attendee_count_trigger ON event_attendees;

-- Create triggers
CREATE TRIGGER update_community_member_count_trigger
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION update_community_member_count();

CREATE TRIGGER update_event_attendee_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_event_attendee_count();

-- =============================================================================
-- 4. ENSURE COMMUNITIES TABLE HAS MEMBER_COUNT COLUMN
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'member_count'
  ) THEN
    ALTER TABLE communities ADD COLUMN member_count integer DEFAULT 0;
    RAISE NOTICE 'Added member_count column to communities table';
  END IF;
END $$;

-- =============================================================================
-- 5. ENSURE EVENTS TABLE HAS ATTENDEE_COUNT COLUMN
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'attendee_count'
  ) THEN
    ALTER TABLE events ADD COLUMN attendee_count integer DEFAULT 0;
    RAISE NOTICE 'Added attendee_count column to events table';
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
  missing_tables text[] := ARRAY[]::text[];
  missing_columns text[] := ARRAY[]::text[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'SCHEMA VERIFICATION';
  RAISE NOTICE '=============================================================================';

  -- Check required tables
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_members') THEN
    missing_tables := array_append(missing_tables, 'community_members');
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_attendees') THEN
    missing_tables := array_append(missing_tables, 'event_attendees');
  END IF;

  -- Check required columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'member_count'
  ) THEN
    missing_columns := array_append(missing_columns, 'communities.member_count');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'attendee_count'
  ) THEN
    missing_columns := array_append(missing_columns, 'events.attendee_count');
  END IF;

  -- Report results
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION '❌ Missing required tables: %', array_to_string(missing_tables, ', ');
  END IF;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION '❌ Missing required columns: %', array_to_string(missing_columns, ', ');
  END IF;

  RAISE NOTICE '✅ All required tables exist:';
  RAISE NOTICE '   - community_members';
  RAISE NOTICE '   - event_attendees';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All required columns exist:';
  RAISE NOTICE '   - communities.member_count';
  RAISE NOTICE '   - events.attendee_count';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Schema fix completed successfully!';
  RAISE NOTICE '=============================================================================';
END $$;
