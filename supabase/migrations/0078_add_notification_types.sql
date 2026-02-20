-- Add new notification types to support all notification preferences

-- Add RESERVATION to entity_type enum
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'RESERVATION';

-- Add new types to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'INCIDENT_OPENED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'INCIDENT_RESOLVED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'RESERVATION_CONFIRMED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'RESERVATION_CHECKIN_SOON';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'RESERVATION_CHECKOUT_TODAY';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'URGENT_MISSION';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'MISSION_REMINDER';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'MISSION_LATE';

COMMENT ON TYPE entity_type IS
'Types of entities that notifications can reference. Includes logements, missions, incidents, and reservations.';

COMMENT ON TYPE notification_type IS
'Types of notifications that can be sent to users. Extended to support all notification preferences.';
