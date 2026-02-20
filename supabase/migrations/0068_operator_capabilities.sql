-- Add operator capabilities column for auto-assignment
-- This allows operators to specify which mission types and zones they can handle

-- Add capabilities column to profiles
ALTER TABLE profiles
ADD COLUMN operator_capabilities JSONB DEFAULT '{
  "mission_types": [],
  "zones": []
}'::jsonb;

-- Create GIN index for fast JSONB queries
CREATE INDEX idx_profiles_operator_capabilities
ON profiles USING gin (operator_capabilities);

-- Update existing operators with empty capabilities
UPDATE profiles
SET operator_capabilities = '{
  "mission_types": [],
  "zones": []
}'::jsonb
WHERE role = 'OPERATEUR' AND operator_capabilities IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.operator_capabilities IS
'JSONB object storing operator capabilities for auto-assignment: mission types and geographic zones';
