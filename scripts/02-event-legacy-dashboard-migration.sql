-- ==========================================
-- Legacy Dashboard Event Creation Migration
-- Adds support for enhanced event types with
-- conditional fields, agenda, speakers, sponsors, tickets
-- ==========================================

-- ==========================================
-- 1. Enhance events table
-- ==========================================

-- Add new columns to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Maputo',
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS venue_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS show_map BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS external_url TEXT,
ADD COLUMN IF NOT EXISTS virtual_instructions TEXT;

-- Add constraints
ALTER TABLE events
ADD CONSTRAINT events_event_type_check
CHECK (event_type IN ('virtual', 'in_person', 'hybrid'));

ALTER TABLE events
ADD CONSTRAINT events_status_check
CHECK (status IN ('draft', 'published', 'cancelled'));

-- Migrate existing events (set defaults based on is_online if it exists)
UPDATE events
SET
  event_type = CASE
    WHEN is_online = true THEN 'virtual'
    ELSE 'in_person'
  END,
  status = 'published',
  timezone = 'Africa/Maputo'
WHERE event_type IS NULL;

-- Make event_type required after migration
ALTER TABLE events
ALTER COLUMN event_type SET NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_hidden ON events(is_hidden) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags);

-- ==========================================
-- 2. Create event_agenda_items table
-- ==========================================

CREATE TABLE IF NOT EXISTS event_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_agenda_items_event_id ON event_agenda_items(event_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_order ON event_agenda_items(event_id, order_index);

-- ==========================================
-- 3. Create event_speakers table
-- ==========================================

CREATE TABLE IF NOT EXISTS event_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_speakers_event_id ON event_speakers(event_id);
CREATE INDEX IF NOT EXISTS idx_speakers_order ON event_speakers(event_id, order_index);

-- ==========================================
-- 4. Create event_sponsors table
-- ==========================================

CREATE TABLE IF NOT EXISTS event_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  tier TEXT,
  website_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT sponsors_tier_check CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze', 'partner'))
);

CREATE INDEX IF NOT EXISTS idx_sponsors_event_id ON event_sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_order ON event_sponsors(event_id, order_index);

-- ==========================================
-- 5. Create event_tickets table
-- ==========================================

CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER,
  available_quantity INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_quantity CHECK (available_quantity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON event_tickets(event_id);

-- ==========================================
-- 6. Enhance rsvps table (if needed)
-- ==========================================

-- Add ticket relationship to RSVPs
ALTER TABLE rsvps
ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES event_tickets(id),
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;

-- ==========================================
-- 7. Row Level Security Policies
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE event_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

-- Agenda items follow event visibility
CREATE POLICY "Agenda items are viewable for published events"
  ON event_agenda_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND (status = 'published' OR organizer_id = auth.uid())
    )
  );

CREATE POLICY "Organizers can manage their agenda items"
  ON event_agenda_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id AND organizer_id = auth.uid()
    )
  );

-- Speakers follow event visibility
CREATE POLICY "Speakers are viewable for published events"
  ON event_speakers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND (status = 'published' OR organizer_id = auth.uid())
    )
  );

CREATE POLICY "Organizers can manage their speakers"
  ON event_speakers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id AND organizer_id = auth.uid()
    )
  );

-- Sponsors follow event visibility
CREATE POLICY "Sponsors are viewable for published events"
  ON event_sponsors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND (status = 'published' OR organizer_id = auth.uid())
    )
  );

CREATE POLICY "Organizers can manage their sponsors"
  ON event_sponsors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id AND organizer_id = auth.uid()
    )
  );

-- Tickets follow event visibility
CREATE POLICY "Tickets are viewable for published events"
  ON event_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND (status = 'published' OR organizer_id = auth.uid())
    )
  );

CREATE POLICY "Organizers can manage their tickets"
  ON event_tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id AND organizer_id = auth.uid()
    )
  );

-- ==========================================
-- 8. Update existing RLS policies for events
-- ==========================================

-- Drop old policy if exists
DROP POLICY IF EXISTS "Events are public" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;

-- New policy: Can view published events OR own drafts
CREATE POLICY "Can view published events and own drafts"
  ON events FOR SELECT
  USING (
    status = 'published'
    OR (organizer_id = auth.uid() AND status = 'draft')
  );

-- Organizers can create events
CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND organizer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );

-- Organizers can update their own events
CREATE POLICY "Organizers can update their own events"
  ON events FOR UPDATE
  USING (organizer_id = auth.uid());

-- Organizers can delete their own events
CREATE POLICY "Organizers can delete their own events"
  ON events FOR DELETE
  USING (organizer_id = auth.uid());

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Legacy Dashboard Event Migration Complete!';
  RAISE NOTICE 'New tables created: event_agenda_items, event_speakers, event_sponsors, event_tickets';
  RAISE NOTICE 'Events table enhanced with event_type, status, timezone, and more';
  RAISE NOTICE 'RLS policies configured for all new tables';
END $$;
