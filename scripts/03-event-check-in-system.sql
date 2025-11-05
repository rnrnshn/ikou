-- Event Check-In System Migration
-- Adds QR code generation, check-in tracking, and attendance analytics

-- Add QR code fields to rsvps table
ALTER TABLE rsvps
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS check_in_count INTEGER DEFAULT 0;

-- Create index for QR token lookups
CREATE INDEX IF NOT EXISTS idx_rsvps_qr_token ON rsvps(qr_token);
CREATE INDEX IF NOT EXISTS idx_rsvps_checked_in ON rsvps(checked_in);

-- Create event_check_ins table
CREATE TABLE IF NOT EXISTS event_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rsvp_id UUID NOT NULL REFERENCES rsvps(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by UUID REFERENCES profiles(id), -- Organizer who checked them in
  check_in_method TEXT NOT NULL DEFAULT 'manual', -- 'qr_scan', 'manual', 'self_check_in'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_check_ins_rsvp ON event_check_ins(rsvp_id);
CREATE INDEX IF NOT EXISTS idx_event_check_ins_event ON event_check_ins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_check_ins_user ON event_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_event_check_ins_time ON event_check_ins(checked_in_at);

-- Prevent duplicate check-ins (one check-in per RSVP per event)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_check_ins_unique ON event_check_ins(rsvp_id, event_id);

-- RLS Policies for event_check_ins table
ALTER TABLE event_check_ins ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view check-ins for events they RSVPed to
CREATE POLICY "Users can view their own check-ins"
  ON event_check_ins FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Organizers can view all check-ins for their community's events
CREATE POLICY "Organizers can view all check-ins for their events"
  ON event_check_ins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      INNER JOIN communities c ON e.community_id = c.id
      WHERE e.id = event_check_ins.event_id
        AND c.organizer_id = auth.uid()
    )
  );

-- Policy: Organizers can create check-ins for their community's events
CREATE POLICY "Organizers can create check-ins"
  ON event_check_ins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      INNER JOIN communities c ON e.community_id = c.id
      WHERE e.id = event_check_ins.event_id
        AND c.organizer_id = auth.uid()
    )
  );

-- Policy: Organizers can update check-ins for their community's events
CREATE POLICY "Organizers can update check-ins"
  ON event_check_ins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      INNER JOIN communities c ON e.community_id = c.id
      WHERE e.id = event_check_ins.event_id
        AND c.organizer_id = auth.uid()
    )
  );

-- Policy: Organizers can delete check-ins for their community's events
CREATE POLICY "Organizers can delete check-ins"
  ON event_check_ins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      INNER JOIN communities c ON e.community_id = c.id
      WHERE e.id = event_check_ins.event_id
        AND c.organizer_id = auth.uid()
    )
  );

-- Function to automatically update checked_in status on rsvps
CREATE OR REPLACE FUNCTION update_rsvp_check_in_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Mark RSVP as checked in and increment counter
    UPDATE rsvps
    SET
      checked_in = TRUE,
      check_in_count = check_in_count + 1
    WHERE id = NEW.rsvp_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement counter and check if any check-ins remain
    UPDATE rsvps
    SET
      check_in_count = GREATEST(0, check_in_count - 1),
      checked_in = EXISTS (
        SELECT 1 FROM event_check_ins
        WHERE rsvp_id = OLD.rsvp_id
      )
    WHERE id = OLD.rsvp_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update RSVP status when check-ins are created/deleted
DROP TRIGGER IF EXISTS trigger_update_rsvp_check_in ON event_check_ins;
CREATE TRIGGER trigger_update_rsvp_check_in
  AFTER INSERT OR DELETE ON event_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_rsvp_check_in_status();

-- Function to generate QR tokens for existing RSVPs
CREATE OR REPLACE FUNCTION generate_qr_tokens_for_existing_rsvps()
RETURNS void AS $$
BEGIN
  UPDATE rsvps
  SET qr_token = gen_random_uuid()::text
  WHERE qr_token IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Generate QR tokens for existing RSVPs
SELECT generate_qr_tokens_for_existing_rsvps();

-- Create a view for check-in statistics by event
CREATE OR REPLACE VIEW event_check_in_stats AS
SELECT
  e.id as event_id,
  e.title as event_title,
  COUNT(DISTINCT r.id) as total_rsvps,
  COUNT(DISTINCT CASE WHEN r.checked_in THEN r.id END) as checked_in_count,
  COUNT(DISTINCT CASE WHEN NOT r.checked_in THEN r.id END) as no_show_count,
  ROUND(
    (COUNT(DISTINCT CASE WHEN r.checked_in THEN r.id END)::decimal /
     NULLIF(COUNT(DISTINCT r.id), 0) * 100), 2
  ) as check_in_rate,
  MIN(c.checked_in_at) as first_check_in,
  MAX(c.checked_in_at) as last_check_in
FROM events e
LEFT JOIN rsvps r ON e.id = r.event_id
LEFT JOIN event_check_ins c ON r.id = c.rsvp_id
GROUP BY e.id, e.title;

-- Grant access to the view
GRANT SELECT ON event_check_in_stats TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE event_check_ins IS 'Tracks attendance at events through check-ins';
COMMENT ON COLUMN event_check_ins.check_in_method IS 'Method used: qr_scan, manual, or self_check_in';
COMMENT ON COLUMN rsvps.qr_token IS 'Unique token for QR code verification';
COMMENT ON VIEW event_check_in_stats IS 'Real-time check-in statistics by event';
