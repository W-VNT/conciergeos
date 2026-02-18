-- Add check-in and check-out times to reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '15:00',
  ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '11:00';
