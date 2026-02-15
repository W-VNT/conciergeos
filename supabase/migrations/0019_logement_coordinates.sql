-- Add GPS coordinates to logements table
ALTER TABLE logements
  ADD COLUMN latitude DECIMAL(10, 8),
  ADD COLUMN longitude DECIMAL(11, 8);

-- Add check constraints for valid coordinate ranges
ALTER TABLE logements
  ADD CONSTRAINT latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  ADD CONSTRAINT longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Add index for geo queries
CREATE INDEX idx_logements_coordinates ON logements(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments
COMMENT ON COLUMN logements.latitude IS 'Latitude GPS (WGS84)';
COMMENT ON COLUMN logements.longitude IS 'Longitude GPS (WGS84)';
