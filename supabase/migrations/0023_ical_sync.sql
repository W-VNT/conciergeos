-- Add iCal sync fields to logements table
ALTER TABLE logements
  ADD COLUMN ical_url TEXT,
  ADD COLUMN ical_last_synced_at TIMESTAMPTZ;

-- Create comment
COMMENT ON COLUMN logements.ical_url IS 'URL du calendrier iCal pour la synchronisation automatique (Airbnb, Booking.com, etc.)';
COMMENT ON COLUMN logements.ical_last_synced_at IS 'Date de la dernière synchronisation iCal';
