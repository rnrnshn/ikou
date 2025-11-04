-- Update events table schema to match application code
-- Replace old columns (event_date, duration_hours, venue_name, address, city)
-- with new columns (start_date, end_date, location)

-- Add new columns
ALTER TABLE events
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS attendee_count integer DEFAULT 0;

-- Migrate data from old columns to new ones (if old columns exist)
DO $$
BEGIN
    -- Check if event_date column exists and migrate data
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='events' AND column_name='event_date') THEN
        UPDATE events
        SET start_date = event_date,
            end_date = event_date + (duration_hours || ' hours')::interval
        WHERE start_date IS NULL;
    END IF;

    -- Check if venue_name/address/city columns exist and migrate data
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='events' AND column_name='venue_name') THEN
        UPDATE events
        SET location = CONCAT_WS(', ', venue_name, address, city)
        WHERE location IS NULL;
    END IF;
END $$;

-- Drop old columns (if they exist)
ALTER TABLE events
DROP COLUMN IF EXISTS event_date,
DROP COLUMN IF EXISTS duration_hours,
DROP COLUMN IF EXISTS venue_name,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS is_online,
DROP COLUMN IF EXISTS max_attendees,
DROP COLUMN IF EXISTS status;

-- Make required columns NOT NULL
ALTER TABLE events
ALTER COLUMN start_date SET NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_community_id ON events(community_id);
