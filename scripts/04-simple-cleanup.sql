-- Simple direct cleanup script
-- Drop incorrect tables from wrong schema

-- Drop tables with CASCADE to handle any dependencies
DROP TABLE IF EXISTS public.event_attendees CASCADE;
DROP TABLE IF EXISTS public.community_members CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Verify correct tables still exist
SELECT
  'profiles' as table_name,
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') as exists
UNION ALL
SELECT
  'communities',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'communities')
UNION ALL
SELECT
  'events',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events')
UNION ALL
SELECT
  'rsvps',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rsvps')
UNION ALL
SELECT
  'community_followers',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_followers');
