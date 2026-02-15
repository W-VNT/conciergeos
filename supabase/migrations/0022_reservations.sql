-- Migration: Create reservations table
-- Description: Core booking/reservation management for conciergerie

-- Platform enum (where the booking comes from)
CREATE TYPE booking_platform AS ENUM ('AIRBNB', 'BOOKING', 'DIRECT', 'AUTRE');

-- Reservation status enum
CREATE TYPE reservation_status AS ENUM ('CONFIRMEE', 'ANNULEE', 'TERMINEE');

-- Reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  logement_id UUID NOT NULL REFERENCES logements(id) ON DELETE CASCADE,

  -- Guest information
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  guest_count INTEGER DEFAULT 1 CHECK (guest_count > 0),

  -- Booking details
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  platform booking_platform NOT NULL DEFAULT 'DIRECT',
  amount DECIMAL(10, 2) CHECK (amount >= 0),

  -- Status and notes
  status reservation_status NOT NULL DEFAULT 'CONFIRMEE',
  notes TEXT,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_dates CHECK (check_in_date < check_out_date),
  CONSTRAINT valid_guest_count CHECK (guest_count > 0)
);

-- Indexes for performance
CREATE INDEX idx_reservations_org ON reservations(organisation_id);
CREATE INDEX idx_reservations_logement ON reservations(logement_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Users can view reservations of their organisation
CREATE POLICY "Users can view org reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can insert reservations
CREATE POLICY "Admins can insert reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can update reservations
CREATE POLICY "Admins can update reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can delete reservations
CREATE POLICY "Admins can delete reservations"
  ON reservations FOR DELETE
  TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
