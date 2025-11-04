-- Create event_attendees table for RSVP tracking
-- This replaces the old 'rsvps' table with more detailed attendance tracking

-- Drop old rsvps table if it exists
DROP TABLE IF EXISTS rsvps CASCADE;

-- Create event_attendees table
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

-- Enable RLS
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_attendees
-- Users can view all attendees
CREATE POLICY "event_attendees_select_all" ON event_attendees
  FOR SELECT USING (true);

-- Users can insert their own attendance
CREATE POLICY "event_attendees_insert_own" ON event_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own attendance
CREATE POLICY "event_attendees_update_own" ON event_attendees
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own attendance
CREATE POLICY "event_attendees_delete_own" ON event_attendees
  FOR DELETE USING (auth.uid() = user_id);

-- Event organizers can delete any attendance for their events
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

-- Create function to update attendee_count on events table
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the attendee_count on the events table
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

-- Create trigger to update attendee count
DROP TRIGGER IF EXISTS update_event_attendee_count_trigger ON event_attendees;
CREATE TRIGGER update_event_attendee_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_event_attendee_count();
