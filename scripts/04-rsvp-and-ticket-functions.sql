-- RSVP and Ticket Management Functions
-- Adds database functions for handling RSVPs and ticket quantity management

-- Function to atomically decrement ticket quantity
CREATE OR REPLACE FUNCTION decrement_ticket_quantity(ticket_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE event_tickets
  SET available_quantity = GREATEST(0, available_quantity - 1)
  WHERE id = ticket_id
    AND available_quantity > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found or sold out';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment ticket quantity (for cancellations)
CREATE OR REPLACE FUNCTION increment_ticket_quantity(ticket_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE event_tickets
  SET available_quantity = LEAST(quantity, available_quantity + 1)
  WHERE id = ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically decrement ticket quantity on RSVP
CREATE OR REPLACE FUNCTION auto_decrement_ticket_on_rsvp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_id IS NOT NULL THEN
    PERFORM decrement_ticket_quantity(NEW.ticket_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_decrement_ticket ON rsvps;
CREATE TRIGGER trigger_decrement_ticket
  AFTER INSERT ON rsvps
  FOR EACH ROW
  EXECUTE FUNCTION auto_decrement_ticket_on_rsvp();

-- Trigger to automatically increment ticket quantity on RSVP deletion
CREATE OR REPLACE FUNCTION auto_increment_ticket_on_rsvp_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.ticket_id IS NOT NULL THEN
    PERFORM increment_ticket_quantity(OLD.ticket_id);
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_increment_ticket ON rsvps;
CREATE TRIGGER trigger_increment_ticket
  AFTER DELETE ON rsvps
  FOR EACH ROW
  EXECUTE FUNCTION auto_increment_ticket_on_rsvp_delete();

-- Add comment for documentation
COMMENT ON FUNCTION decrement_ticket_quantity IS 'Atomically decrements ticket quantity when RSVP is created';
COMMENT ON FUNCTION increment_ticket_quantity IS 'Atomically increments ticket quantity when RSVP is cancelled';
