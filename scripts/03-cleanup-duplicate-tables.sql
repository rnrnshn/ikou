-- =============================================================================
-- CLEANUP SCRIPT: Remove Duplicate/Incorrect Tables
-- =============================================================================
-- This script removes tables from the incorrect schema (01-init-schema.sql)
-- that conflict with the correct schema (001_initial_schema.sql)
--
-- SAFE TO RUN: All these tables are currently empty (0 rows)
--
-- Tables to DROP (from wrong schema):
--   - users (conflicts with profiles)
--   - event_attendees (conflicts with rsvps)
--   - community_members (conflicts with community_followers)
--
-- Tables to KEEP (from correct schema):
--   - profiles ✅
--   - communities ✅
--   - events ✅
--   - rsvps ✅
--   - community_followers ✅
-- =============================================================================

-- Drop tables in correct order (respecting foreign key dependencies)
-- Start with tables that have foreign keys first

DO $$
BEGIN
    -- Drop event_attendees table (wrong schema)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_attendees') THEN
        RAISE NOTICE 'Dropping event_attendees table...';
        DROP TABLE IF EXISTS public.event_attendees CASCADE;
        RAISE NOTICE '✅ event_attendees table dropped';
    ELSE
        RAISE NOTICE 'ℹ️  event_attendees table does not exist';
    END IF;

    -- Drop community_members table (wrong schema)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_members') THEN
        RAISE NOTICE 'Dropping community_members table...';
        DROP TABLE IF EXISTS public.community_members CASCADE;
        RAISE NOTICE '✅ community_members table dropped';
    ELSE
        RAISE NOTICE 'ℹ️  community_members table does not exist';
    END IF;

    -- Drop users table (wrong schema)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        RAISE NOTICE 'Dropping users table...';
        DROP TABLE IF EXISTS public.users CASCADE;
        RAISE NOTICE '✅ users table dropped';
    ELSE
        RAISE NOTICE 'ℹ️  users table does not exist';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '🎉 Cleanup complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Remaining tables (correct schema):';
    RAISE NOTICE '  ✅ profiles';
    RAISE NOTICE '  ✅ communities';
    RAISE NOTICE '  ✅ events';
    RAISE NOTICE '  ✅ rsvps';
    RAISE NOTICE '  ✅ community_followers';
END $$;

-- Verify the correct tables still exist
DO $$
DECLARE
    missing_tables text[] := ARRAY[]::text[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verifying correct tables exist...';

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        missing_tables := array_append(missing_tables, 'profiles');
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'communities') THEN
        missing_tables := array_append(missing_tables, 'communities');
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
        missing_tables := array_append(missing_tables, 'events');
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rsvps') THEN
        missing_tables := array_append(missing_tables, 'rsvps');
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_followers') THEN
        missing_tables := array_append(missing_tables, 'community_followers');
    END IF;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION '❌ Missing required tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ All required tables exist!';
    END IF;
END $$;
