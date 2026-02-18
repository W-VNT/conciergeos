// ============================================================
// ConciergeOS — Database Types (aligned with SQL enums & tables)
// ============================================================

// Enums
export type UserRole = 'ADMIN' | 'OPERATEUR';
export type StatutJuridique = 'PARTICULIER' | 'SCI' | 'SARL' | 'SAS' | 'EURL' | 'AUTRE';
export type OfferTier = 'ESSENTIEL' | 'SERENITE' | 'SIGNATURE';
export type LogementStatus = 'ACTIF' | 'PAUSE' | 'ARCHIVE';
export type MissionType = 'CHECKIN' | 'CHECKOUT' | 'MENAGE' | 'INTERVENTION' | 'URGENCE';
export type MissionStatus = 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
export type MissionPriority = 'NORMALE' | 'HAUTE' | 'CRITIQUE';
export type Specialty = 'MENAGE' | 'PLOMBERIE' | 'ELECTRICITE' | 'CLIM' | 'AUTRE';
export type IncidentSeverity = 'MINEUR' | 'MOYEN' | 'CRITIQUE';
export type IncidentStatus = 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'CLOS';
export type EntityType = 'LOGEMENT' | 'MISSION' | 'INCIDENT' | 'CONTRAT';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
export type ContractType = 'EXCLUSIF' | 'SIMPLE';
export type ContractStatus = 'ACTIF' | 'EXPIRE' | 'RESILIE' | 'SIGNE';
export type BookingPlatform = 'AIRBNB' | 'BOOKING' | 'DIRECT' | 'AUTRE';
export type ReservationStatus = 'CONFIRMEE' | 'ANNULEE' | 'TERMINEE';
export type NotificationType =
  | 'MISSION_ASSIGNED'
  | 'MISSION_URGENT'
  | 'INCIDENT_CRITICAL'
  | 'INCIDENT_ASSIGNED'
  | 'CONTRACT_EXPIRING'
  | 'TEAM_INVITATION'
  | 'RESERVATION_CREATED'
  | 'SYSTEM';
export type EquipementCategorie = 'ELECTROMENAGER' | 'MOBILIER' | 'LINGE' | 'CONSOMMABLE' | 'AUTRE';
export type EquipementEtat = 'BON' | 'MOYEN' | 'A_REMPLACER';
export type FactureStatus = 'ATTENTE' | 'VALIDEE' | 'PAYEE' | 'REFUSEE';

// Tables
export interface Organisation {
  id: string;
  name: string;
  onboarding_completed: boolean;
  city: string | null;
  logo_url: string | null;
  address_line1: string | null;
  postal_code: string | null;
  siret: string | null;
  phone: string | null;
  email: string | null;
  statut_juridique: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  organisation_id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  email?: string | null; // From auth.users, joined in queries
  created_at: string;
}

export interface Proprietaire {
  id: string;
  organisation_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  statut_juridique: StatutJuridique;
  siret: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contrat {
  id: string;
  organisation_id: string;
  proprietaire_id: string;
  logement_id: string | null;
  type: ContractType;
  start_date: string;
  end_date: string;
  commission_rate: number;
  status: ContractStatus;
  conditions: string | null;
  pdf_downloaded_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  proprietaire?: Proprietaire | null;
  logement?: Logement | null;
}

export interface Reservation {
  id: string;
  organisation_id: string;
  logement_id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  guest_count: number;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  platform: BookingPlatform;
  amount: number | null;
  status: ReservationStatus;
  notes: string | null;
  access_instructions: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  logement?: Logement | null;
}

export interface Revenu {
  id: string;
  organisation_id: string;
  reservation_id: string;
  logement_id: string;
  contrat_id: string | null;
  montant_brut: number;
  taux_commission: number;
  montant_commission: number;
  montant_net: number;
  date_reservation: string;
  date_checkin: string;
  date_checkout: string;
  created_at: string;
  updated_at: string;
  // Joined
  reservation?: Reservation | null;
  logement?: Logement | null;
  contrat?: Contrat | null;
}

export interface FacturePrestataire {
  id: string;
  organisation_id: string;
  prestataire_id: string;
  mission_id: string | null;
  incident_id: string | null;
  numero_facture: string | null;
  montant: number;
  date_emission: string;
  date_echeance: string | null;
  status: FactureStatus;
  date_paiement: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  prestataire?: Prestataire | null;
  mission?: Mission | null;
  incident?: Incident | null;
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
  latitude: number | null;
  longitude: number | null;
  offer_tier: OfferTier;
  lockbox_code: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  bedrooms: number | null;
  beds: number | null;
  max_guests: number | null;
  ical_url: string | null;
  ical_last_synced_at: string | null;
  menage_price: number | null;
  notes: string | null;
  status: LogementStatus;
  created_at: string;
  updated_at: string;
  // Joined
  proprietaire?: Proprietaire | null;
}

export interface OfferTierConfig {
  id: string;
  organisation_id: string;
  tier: OfferTier;
  name: string;
  description: string;
  commission_rate: number;
  services: string[];
  created_at: string;
  updated_at: string;
}

export interface Mission {
  id: string;
  organisation_id: string;
  logement_id: string;
  reservation_id: string | null;
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
  reservation?: Reservation | null;
}

export interface Prestataire {
  id: string;
  organisation_id: string;
  full_name: string;
  specialty: Specialty;
  statut_juridique: StatutJuridique;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  zone: string | null;
  hourly_rate: number | null;
  reliability_score: number | null;
  siret: string | null;
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
  notes: string | null;
  expected_resolution_date: string | null;
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

export interface Invitation {
  id: string;
  organisation_id: string;
  email: string;
  role: UserRole;
  token: string;
  invited_by: string;
  expires_at: string;
  status: InvitationStatus;
  created_at: string;
  accepted_at: string | null;
}

export interface Notification {
  id: string;
  organisation_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: EntityType | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Equipement {
  id: string;
  organisation_id: string;
  logement_id: string;
  categorie: EquipementCategorie;
  nom: string;
  quantite: number;
  etat: EquipementEtat;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplate {
  id: string;
  organisation_id: string;
  nom: string;
  type_mission: MissionType;
  description: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplateItem {
  id: string;
  template_id: string;
  titre: string;
  description: string | null;
  categorie: string | null;
  ordre: number;
  photo_requise: boolean;
  created_at: string;
}

export interface MissionChecklistItem {
  id: string;
  mission_id: string;
  item_id: string;
  completed: boolean;
  photo_url: string | null;
  notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  // Joined
  item?: ChecklistTemplateItem;
}

// Enum label maps for UI display
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  OPERATEUR: 'Opérateur',
};

export const STATUT_JURIDIQUE_LABELS: Record<StatutJuridique, string> = {
  PARTICULIER: 'Particulier',
  SCI: 'SCI',
  SARL: 'SARL',
  SAS: 'SAS',
  EURL: 'EURL',
  AUTRE: 'Autre',
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

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  EXCLUSIF: 'Exclusif',
  SIMPLE: 'Simple',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIF: 'Actif',
  EXPIRE: 'Expiré',
  RESILIE: 'Résilié',
  SIGNE: 'Signé',
};

export const BOOKING_PLATFORM_LABELS: Record<BookingPlatform, string> = {
  AIRBNB: 'Airbnb',
  BOOKING: 'Booking.com',
  DIRECT: 'Direct',
  AUTRE: 'Autre',
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMEE: 'Confirmée',
  ANNULEE: 'Annulée',
  TERMINEE: 'Terminée',
};

export const EQUIPEMENT_CATEGORIE_LABELS: Record<EquipementCategorie, string> = {
  ELECTROMENAGER: 'Électroménager',
  MOBILIER: 'Mobilier',
  LINGE: 'Linge',
  CONSOMMABLE: 'Consommables',
  AUTRE: 'Autre',
};

export const EQUIPEMENT_ETAT_LABELS: Record<EquipementEtat, string> = {
  BON: 'Bon état',
  MOYEN: 'État moyen',
  A_REMPLACER: 'À remplacer',
};
