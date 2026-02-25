// ============================================================
// ConciergeOS — Database Types (aligned with SQL enums & tables)
// ============================================================

// Enums
export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATEUR' | 'PROPRIETAIRE';
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
export type ReservationStatus = 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'TERMINEE';
export type IncidentCategory = 'PLOMBERIE' | 'ELECTRICITE' | 'SERRURERIE' | 'NUISIBLES' | 'MENAGE' | 'BRUIT' | 'EQUIPEMENT' | 'AUTRE';
export type PaymentStatus = 'EN_ATTENTE' | 'PARTIEL' | 'PAYE' | 'REMBOURSE';
export type NotificationType =
  | 'MISSION_ASSIGNED'
  | 'MISSION_URGENT'
  | 'INCIDENT_CRITICAL'
  | 'INCIDENT_ASSIGNED'
  | 'CONTRACT_EXPIRING'
  | 'TEAM_INVITATION'
  | 'RESERVATION_CREATED'
  | 'SYSTEM';
export type MessageTemplateType = 'CONFIRMATION' | 'RAPPEL' | 'REMERCIEMENT' | 'ACCES' | 'CUSTOM';
export type MessageChannel = 'EMAIL' | 'SMS';
export type MessageStatus = 'PENDING' | 'SENT' | 'FAILED';
export type RecurrenceFrequency = 'HEBDOMADAIRE' | 'BIMENSUEL' | 'MENSUEL';
export type SlaEntityType = 'MISSION' | 'INCIDENT';
export type ActivityAction = 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'ASSIGNED' | 'CREATED' | 'UPDATED' | 'DELETED';
export type EmailDigest = 'NONE' | 'QUOTIDIEN' | 'HEBDOMADAIRE';
export type SeasonType = 'HAUTE' | 'BASSE' | 'MOYENNE';
export type EquipementCategorie = 'ELECTROMENAGER' | 'MOBILIER' | 'LINGE' | 'CONSOMMABLE' | 'AUTRE';
export type EquipementEtat = 'BON' | 'MOYEN' | 'A_REMPLACER';
export type FactureStatus = 'ATTENTE' | 'VALIDEE' | 'PAYEE' | 'REFUSEE';
export type DevisStatus = 'SOUMIS' | 'ACCEPTE' | 'REFUSE';

// Sprint 5
export type EtatDesLieuxType = 'ENTREE' | 'SORTIE';
export type EtatDesLieuxStatus = 'BROUILLON' | 'SIGNE' | 'VALIDE';
export type ItemCondition = 'BON' | 'CORRECT' | 'DEGRADE' | 'MAUVAIS';
export type MissionReportStatus = 'SOUMIS' | 'VALIDE' | 'REJETE';
export type OwnerPaymentStatus = 'DU' | 'PAYE' | 'PARTIEL' | 'EN_RETARD';
export type PrestataireDocType = 'CERTIFICATION' | 'ASSURANCE' | 'KBIS' | 'RIB' | 'AUTRE';
export type ProprietaireDocType = 'IDENTITE' | 'DIAGNOSTIC' | 'TITRE_PROPRIETE' | 'ASSURANCE' | 'RIB' | 'AUTRE';

// Sprint 6
export type BidStatus = 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';
export type StockMovementType = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
export type PreventiveFrequency = 'HEBDOMADAIRE' | 'BIMENSUEL' | 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL';
export type WarrantyType = 'GARANTIE' | 'ASSURANCE';
export type ReconciliationStatus = 'NON_RAPPROCHE' | 'RAPPROCHE' | 'ECART';
export type BudgetCategory = 'GLOBAL' | 'REVENUS' | 'CHARGES' | 'MAINTENANCE';
export type Currency = 'EUR' | 'USD' | 'GBP';

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
  preferred_currency: Currency;
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
  email_confirmed_at?: string | null; // From auth.users
  proprietaire_id?: string | null;
  operator_capabilities?: OperatorCapabilities | null;
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
  auto_renew: boolean;
  renewal_duration_months: number;
  renewal_notified_at: string | null;
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
  payment_status: PaymentStatus | null;
  payment_date: string | null;
  currency: Currency;
  amount_eur: number | null;
  source: string | null;
  voyageur_id: string | null;
  notes: string | null;
  access_instructions: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  logement?: Logement | null;
  voyageur?: Voyageur | null;
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
  tva_rate: number;
  tva_amount: number;
  currency: Currency;
  montant_brut_eur: number | null;
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
  devis_id: string | null;
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
  devis?: DevisPrestataire | null;
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
  tags: string[] | null;
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
  started_at: string | null;
  time_spent_minutes: number | null;
  depends_on_mission_id: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  open_for_bids: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  logement?: Logement | null;
  assignee?: Profile | null;
  reservation?: Reservation | null;
  depends_on?: Mission | null;
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
  category: IncidentCategory | null;
  description: string;
  cost: number | null;
  notes: string | null;
  expected_resolution_date: string | null;
  open_for_bids: boolean;
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
  caption: string | null;
  position: number;
  is_main: boolean;
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
  group_key: string | null;
  created_at: string;
  metadata: { mission_type?: string; [key: string]: string | undefined } | null;
}

export interface Equipement {
  id: string;
  organisation_id: string;
  logement_id: string;
  categorie: EquipementCategorie;
  nom: string;
  quantite: number;
  etat: EquipementEtat;
  seuil_alerte: number | null;
  unite: string | null;
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

export interface PricingSeason {
  id: string;
  organisation_id: string;
  logement_id: string;
  name: string;
  start_month: number;
  end_month: number;
  price_per_night: number;
  created_at: string;
  updated_at: string;
}

export interface IncidentResponseTemplate {
  id: string;
  organisation_id: string;
  name: string;
  category: IncidentCategory | null;
  content: string;
  created_at: string;
  updated_at: string;
}

// Mission Comments
export interface MissionComment {
  id: string;
  organisation_id: string;
  mission_id: string;
  author_id: string;
  content: string;
  created_at: string;
  // Joined
  author?: Profile | null;
}

// Mission Recurrences
export interface MissionRecurrence {
  id: string;
  organisation_id: string;
  logement_id: string;
  type: MissionType;
  frequency: RecurrenceFrequency;
  day_of_week: number | null;
  day_of_month: number | null;
  scheduled_time: string;
  assigned_to: string | null;
  priority: MissionPriority;
  notes: string | null;
  active: boolean;
  last_generated_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  logement?: Logement | null;
  assignee?: Profile | null;
}

// SLA Configuration
export interface SlaConfig {
  id: string;
  organisation_id: string;
  entity_type: SlaEntityType;
  subtype: string;
  max_hours: number;
  created_at: string;
  updated_at: string;
}

// Activity Logs
export interface ActivityLog {
  id: string;
  organisation_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Joined
  actor?: Profile | null;
}

// Message Templates
export interface MessageTemplate {
  id: string;
  organisation_id: string;
  name: string;
  subject: string;
  body: string;
  type: MessageTemplateType;
  channel: MessageChannel;
  active: boolean;
  trigger_event: string | null;
  created_at: string;
  updated_at: string;
}

// Guest Messages
export interface GuestMessage {
  id: string;
  organisation_id: string;
  reservation_id: string;
  template_id: string | null;
  channel: MessageChannel;
  recipient: string;
  subject: string | null;
  body: string;
  status: MessageStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

// Guest Portal Tokens
export interface GuestPortalToken {
  id: string;
  reservation_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// Operator Capabilities for Auto-Assignment
export interface OperatorCapabilities {
  mission_types: MissionType[];
  zones: string[];
}

// Bulk Assignment Types
export interface BulkAssignmentRequest {
  mission_ids: string[];
  operator_id: string;
  organisation_id: string;
}

export interface AutoAssignmentResult {
  assigned: Array<{
    mission_id: string;
    operator_id: string;
    operator_name: string;
  }>;
  unassigned: Array<{
    mission_id: string;
    reason: string;
  }>;
}

// Sprint 4: Voyageur CRM
export interface Voyageur {
  id: string;
  organisation_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  language: string | null;
  nationality: string | null;
  notes: string | null;
  preferences: Record<string, unknown>;
  tags: string[];
  total_stays: number;
  total_revenue: number;
  average_rating: number | null;
  created_at: string;
  updated_at: string;
}

// Sprint 4: Devis Prestataire
export interface DevisPrestataire {
  id: string;
  organisation_id: string;
  prestataire_id: string;
  incident_id: string | null;
  mission_id: string | null;
  montant: number;
  description: string;
  status: DevisStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  prestataire?: Prestataire | null;
  incident?: Incident | null;
  mission?: Mission | null;
  reviewer?: Profile | null;
}

// Sprint 4: Prestataire Portal Token
export interface PrestatairePortalToken {
  id: string;
  prestataire_id: string;
  organisation_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// Sprint 4: Owner Messages
export interface OwnerMessage {
  id: string;
  organisation_id: string;
  proprietaire_id: string;
  sender_type: 'ADMIN' | 'OWNER';
  sender_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
  // Joined
  sender?: Profile | null;
}

// Sprint 5: Audit Log
export interface AuditLog {
  id: string;
  organisation_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined
  user?: Profile | null;
}

// Sprint 5: État des lieux
export interface EtatDesLieux {
  id: string;
  organisation_id: string;
  reservation_id: string | null;
  logement_id: string;
  type: EtatDesLieuxType;
  status: EtatDesLieuxStatus;
  inspector_id: string | null;
  guest_signature_url: string | null;
  inspector_signature_url: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  logement?: Logement | null;
  reservation?: Reservation | null;
  inspector?: Profile | null;
  items?: EtatDesLieuxItem[];
}

export interface EtatDesLieuxItem {
  id: string;
  etat_des_lieux_id: string;
  room: string;
  element: string;
  condition: ItemCondition;
  photo_urls: string[];
  notes: string | null;
  position: number;
}

// Sprint 5: Webhooks
export interface WebhookEndpoint {
  id: string;
  organisation_id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  payload: Record<string, unknown>;
  status_code: number | null;
  response_body: string | null;
  delivered_at: string;
}

// Sprint 5: Mission Reports
export interface MissionReport {
  id: string;
  mission_id: string;
  organisation_id: string;
  submitted_by: string | null;
  status: MissionReportStatus;
  checklist: Array<{ label: string; checked: boolean }>;
  notes: string | null;
  photo_urls: string[];
  issues_found: string | null;
  supplies_used: Array<{ name: string; quantity: number }>;
  created_at: string;
  updated_at: string;
  // Joined
  mission?: Mission | null;
  submitter?: Profile | null;
}

// Sprint 5: Mission Templates
export interface MissionTemplate {
  id: string;
  organisation_id: string;
  name: string;
  type: string;
  logement_id: string | null;
  description: string | null;
  estimated_duration_minutes: number | null;
  checklist: Array<{ label: string }>;
  priority: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  logement?: Logement | null;
}

// Sprint 5: Intervention Checklist
export interface InterventionChecklist {
  id: string;
  incident_id: string;
  organisation_id: string;
  items: Array<{ label: string; checked: boolean; note?: string }>;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string;
}

// Sprint 5: Contract Template
export interface ContratTemplate {
  id: string;
  organisation_id: string;
  name: string;
  content: string;
  variables: Array<{ key: string; label: string; default_value?: string }>;
  category: string;
  created_at: string;
  updated_at: string;
}

// Sprint 5: Contract Version
export interface ContratVersion {
  id: string;
  contrat_id: string;
  organisation_id: string;
  version_number: number;
  content: Record<string, unknown>;
  changed_by: string | null;
  change_summary: string | null;
  created_at: string;
  // Joined
  changer?: Profile | null;
}

// Sprint 5: Owner Payments
export interface OwnerPayment {
  id: string;
  organisation_id: string;
  proprietaire_id: string;
  contrat_id: string | null;
  amount: number;
  period_start: string | null;
  period_end: string | null;
  status: OwnerPaymentStatus;
  paid_amount: number;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  proprietaire?: Proprietaire | null;
  contrat?: Contrat | null;
}

// Sprint 5: Prestataire Documents
export interface PrestataireDocument {
  id: string;
  prestataire_id: string;
  organisation_id: string;
  type: PrestataireDocType;
  name: string;
  file_url: string;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}

// Sprint 5: Proprietaire Documents
export interface ProprietaireDocument {
  id: string;
  proprietaire_id: string;
  organisation_id: string;
  type: ProprietaireDocType;
  name: string;
  file_url: string;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}

// Enum label maps for UI display
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  OPERATEUR: 'Opérateur',
  PROPRIETAIRE: 'Propriétaire',
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
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  ANNULEE: 'Annulée',
  TERMINEE: 'Terminée',
};

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  PLOMBERIE: 'Plomberie',
  ELECTRICITE: 'Électricité',
  SERRURERIE: 'Serrurerie',
  NUISIBLES: 'Nuisibles',
  MENAGE: 'Ménage',
  BRUIT: 'Bruit / Voisinage',
  EQUIPEMENT: 'Équipement',
  AUTRE: 'Autre',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  EN_ATTENTE: 'En attente',
  PARTIEL: 'Partiel',
  PAYE: 'Payé',
  REMBOURSE: 'Remboursé',
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

export const MESSAGE_TEMPLATE_TYPE_LABELS: Record<MessageTemplateType, string> = {
  CONFIRMATION: 'Confirmation',
  RAPPEL: 'Rappel',
  REMERCIEMENT: 'Remerciement',
  ACCES: 'Accès',
  CUSTOM: 'Personnalisé',
};

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  HEBDOMADAIRE: 'Hebdomadaire',
  BIMENSUEL: 'Bimensuel',
  MENSUEL: 'Mensuel',
};

export const EMAIL_DIGEST_LABELS: Record<EmailDigest, string> = {
  NONE: 'Aucun',
  QUOTIDIEN: 'Quotidien',
  HEBDOMADAIRE: 'Hebdomadaire',
};

export const DEVIS_STATUS_LABELS: Record<DevisStatus, string> = {
  SOUMIS: 'Soumis',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
};

export const FACTURE_STATUS_LABELS: Record<FactureStatus, string> = {
  ATTENTE: 'En attente',
  VALIDEE: 'Validée',
  PAYEE: 'Payée',
  REFUSEE: 'Refusée',
};

export const ETAT_DES_LIEUX_TYPE_LABELS: Record<EtatDesLieuxType, string> = {
  ENTREE: 'Entrée',
  SORTIE: 'Sortie',
};

export const ETAT_DES_LIEUX_STATUS_LABELS: Record<EtatDesLieuxStatus, string> = {
  BROUILLON: 'Brouillon',
  SIGNE: 'Signé',
  VALIDE: 'Validé',
};

export const ITEM_CONDITION_LABELS: Record<ItemCondition, string> = {
  BON: 'Bon',
  CORRECT: 'Correct',
  DEGRADE: 'Dégradé',
  MAUVAIS: 'Mauvais',
};

export const MISSION_REPORT_STATUS_LABELS: Record<MissionReportStatus, string> = {
  SOUMIS: 'Soumis',
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
};

export const OWNER_PAYMENT_STATUS_LABELS: Record<OwnerPaymentStatus, string> = {
  DU: 'Dû',
  PAYE: 'Payé',
  PARTIEL: 'Partiel',
  EN_RETARD: 'En retard',
};

export const PRESTATAIRE_DOC_TYPE_LABELS: Record<PrestataireDocType, string> = {
  CERTIFICATION: 'Certification',
  ASSURANCE: 'Assurance',
  KBIS: 'KBIS',
  RIB: 'RIB',
  AUTRE: 'Autre',
};

export const PROPRIETAIRE_DOC_TYPE_LABELS: Record<ProprietaireDocType, string> = {
  IDENTITE: 'Pièce d\'identité',
  DIAGNOSTIC: 'Diagnostic',
  TITRE_PROPRIETE: 'Titre de propriété',
  ASSURANCE: 'Assurance',
  RIB: 'RIB',
  AUTRE: 'Autre',
};

// ── Sprint 6 Interfaces ──────────────────────────────────────

export interface MarketplaceBid {
  id: string;
  organisation_id: string;
  prestataire_id: string;
  mission_id: string | null;
  incident_id: string | null;
  proposed_price: number;
  message: string | null;
  status: BidStatus;
  responded_at: string | null;
  responded_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  prestataire?: Prestataire | null;
  mission?: Mission | null;
  incident?: Incident | null;
  responder?: Profile | null;
}

export interface OperatorPoint {
  id: string;
  organisation_id: string;
  operator_id: string;
  points: number;
  reason: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface OperatorBadge {
  id: string;
  organisation_id: string;
  operator_id: string;
  badge_code: string;
  badge_label: string;
  earned_at: string;
}

export interface StockMovement {
  id: string;
  organisation_id: string;
  equipement_id: string;
  mission_id: string | null;
  type: StockMovementType;
  quantite: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  equipement?: Equipement | null;
  mission?: Mission | null;
  creator?: Profile | null;
}

export interface PreventiveSchedule {
  id: string;
  organisation_id: string;
  logement_id: string;
  title: string;
  description: string | null;
  category: string;
  severity: IncidentSeverity;
  frequency: PreventiveFrequency;
  day_of_week: number | null;
  day_of_month: number | null;
  next_due_date: string;
  last_generated_at: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  logement?: Logement | null;
}

export interface Warranty {
  id: string;
  organisation_id: string;
  logement_id: string | null;
  equipement_id: string | null;
  type: WarrantyType;
  provider: string;
  policy_number: string | null;
  start_date: string;
  end_date: string;
  coverage_details: string | null;
  annual_cost: number | null;
  contact_info: string | null;
  document_url: string | null;
  alert_days_before: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  logement?: Logement | null;
  equipement?: Equipement | null;
}

export interface PlatformPayment {
  id: string;
  organisation_id: string;
  platform: BookingPlatform;
  reference: string | null;
  amount: number;
  payment_date: string;
  reservation_id: string | null;
  reconciliation_status: ReconciliationStatus;
  ecart_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  reservation?: Reservation | null;
}

export interface Budget {
  id: string;
  organisation_id: string;
  logement_id: string | null;
  year: number;
  month: number | null;
  category: BudgetCategory;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  logement?: Logement | null;
}

export interface TvaConfig {
  id: string;
  organisation_id: string;
  label: string;
  rate: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRate {
  id: string;
  organisation_id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
  created_at: string;
}

export interface ContratLogement {
  id: string;
  contrat_id: string;
  logement_id: string;
  commission_rate: number;
  notes: string | null;
  created_at: string;
  // Joined
  logement?: Logement | null;
}

export interface PrestataireAvailability {
  id: string;
  organisation_id: string;
  prestataire_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface PrestataireBlackout {
  id: string;
  organisation_id: string;
  prestataire_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

// Sprint 6 Label Maps

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  EN_ATTENTE: 'En attente',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
};

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  ENTREE: 'Entrée',
  SORTIE: 'Sortie',
  AJUSTEMENT: 'Ajustement',
};

export const PREVENTIVE_FREQUENCY_LABELS: Record<PreventiveFrequency, string> = {
  HEBDOMADAIRE: 'Hebdomadaire',
  BIMENSUEL: 'Bimensuel',
  MENSUEL: 'Mensuel',
  TRIMESTRIEL: 'Trimestriel',
  SEMESTRIEL: 'Semestriel',
  ANNUEL: 'Annuel',
};

export const WARRANTY_TYPE_LABELS: Record<WarrantyType, string> = {
  GARANTIE: 'Garantie',
  ASSURANCE: 'Assurance',
};

export const RECONCILIATION_STATUS_LABELS: Record<ReconciliationStatus, string> = {
  NON_RAPPROCHE: 'Non rapproché',
  RAPPROCHE: 'Rapproché',
  ECART: 'Écart',
};

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  GLOBAL: 'Global',
  REVENUS: 'Revenus',
  CHARGES: 'Charges',
  MAINTENANCE: 'Maintenance',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  EUR: 'Euro (€)',
  USD: 'Dollar ($)',
  GBP: 'Livre (£)',
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};
