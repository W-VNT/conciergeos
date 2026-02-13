// ============================================================
// ConciergeOS — Database Types (aligned with SQL enums & tables)
// ============================================================

// Enums
export type UserRole = 'ADMIN' | 'OPERATEUR';
export type ServiceLevel = 'STANDARD' | 'VIP';
export type OfferTier = 'ESSENTIEL' | 'SERENITE' | 'SIGNATURE';
export type LogementStatus = 'ACTIF' | 'PAUSE' | 'ARCHIVE';
export type MissionType = 'CHECKIN' | 'CHECKOUT' | 'MENAGE' | 'INTERVENTION' | 'URGENCE';
export type MissionStatus = 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
export type MissionPriority = 'NORMALE' | 'HAUTE' | 'CRITIQUE';
export type Specialty = 'MENAGE' | 'PLOMBERIE' | 'ELECTRICITE' | 'CLIM' | 'AUTRE';
export type IncidentSeverity = 'MINEUR' | 'MOYEN' | 'CRITIQUE';
export type IncidentStatus = 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'CLOS';
export type EntityType = 'LOGEMENT' | 'MISSION' | 'INCIDENT';

// Tables
export interface Organisation {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  organisation_id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Proprietaire {
  id: string;
  organisation_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  service_level: ServiceLevel;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Logement {
  id: string;
  organisation_id: string;
  owner_id: string | null;
  name: string;
  address_line1: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  offer_tier: OfferTier;
  lockbox_code: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  notes: string | null;
  status: LogementStatus;
  created_at: string;
  updated_at: string;
  // Joined
  proprietaire?: Proprietaire | null;
}

export interface Mission {
  id: string;
  organisation_id: string;
  logement_id: string;
  assigned_to: string | null;
  type: MissionType;
  status: MissionStatus;
  priority: MissionPriority;
  scheduled_at: string;
  completed_at: string | null;
  time_spent_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  logement?: Logement | null;
  assignee?: Profile | null;
}

export interface Prestataire {
  id: string;
  organisation_id: string;
  full_name: string;
  specialty: Specialty;
  phone: string | null;
  email: string | null;
  zone: string | null;
  hourly_rate: number | null;
  reliability_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  organisation_id: string;
  logement_id: string;
  mission_id: string | null;
  prestataire_id: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  cost: number | null;
  opened_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  logement?: Logement | null;
  prestataire?: Prestataire | null;
  mission?: Mission | null;
}

export interface Attachment {
  id: string;
  organisation_id: string;
  entity_type: EntityType;
  entity_id: string;
  storage_path: string;
  mime_type: string | null;
  created_at: string;
}

// Enum label maps for UI display
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  OPERATEUR: 'Opérateur',
};

export const SERVICE_LEVEL_LABELS: Record<ServiceLevel, string> = {
  STANDARD: 'Standard',
  VIP: 'VIP',
};

export const OFFER_TIER_LABELS: Record<OfferTier, string> = {
  ESSENTIEL: 'Essentiel',
  SERENITE: 'Sérénité',
  SIGNATURE: 'Signature',
};

export const LOGEMENT_STATUS_LABELS: Record<LogementStatus, string> = {
  ACTIF: 'Actif',
  PAUSE: 'En pause',
  ARCHIVE: 'Archivé',
};

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  CHECKIN: 'Check-in',
  CHECKOUT: 'Check-out',
  MENAGE: 'Ménage',
  INTERVENTION: 'Intervention',
  URGENCE: 'Urgence',
};

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

export const MISSION_PRIORITY_LABELS: Record<MissionPriority, string> = {
  NORMALE: 'Normale',
  HAUTE: 'Haute',
  CRITIQUE: 'Critique',
};

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  MENAGE: 'Ménage',
  PLOMBERIE: 'Plomberie',
  ELECTRICITE: 'Électricité',
  CLIM: 'Climatisation',
  AUTRE: 'Autre',
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  MINEUR: 'Mineur',
  MOYEN: 'Moyen',
  CRITIQUE: 'Critique',
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  OUVERT: 'Ouvert',
  EN_COURS: 'En cours',
  RESOLU: 'Résolu',
  CLOS: 'Clos',
};
