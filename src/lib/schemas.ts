import { z } from 'zod';

// Helper: validate HH:MM time format
const timeString = z.string().regex(/^\d{2}:\d{2}$/, 'Format horaire invalide (HH:MM)');

// Helper: coerce to number but treat empty string / NaN as null
const nullableNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
  z.number().nullable().default(null)
);

// Proprietaires
export const proprietaireSchema = z.object({
  full_name: z.string().min(1, 'Nom requis').max(200, 'Nom trop long (200 caractères max)'),
  phone: z.string().max(20, 'Numéro trop long').default(''),
  email: z.string().email('Email invalide').or(z.literal('')).default(''),
  address_line1: z.string().max(500, 'Adresse trop longue').default(''),
  postal_code: z.string().max(20, 'Code postal trop long').default(''),
  city: z.string().max(200, 'Ville trop longue').default(''),
  statut_juridique: z.enum(['PARTICULIER', 'SCI', 'SARL', 'SAS', 'EURL', 'AUTRE']).default('PARTICULIER'),
  siret: z.string().max(14, 'SIRET trop long (14 caractères max)').default(''),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
});
export type ProprietaireFormData = z.infer<typeof proprietaireSchema>;

// Logements
export const logementSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200, 'Nom trop long (200 caractères max)'),
  owner_id: z.string().default(''),
  address_line1: z.string().max(500, 'Adresse trop longue').default(''),
  city: z.string().max(200, 'Ville trop longue').default(''),
  postal_code: z.string().max(20, 'Code postal trop long').default(''),
  country: z.string().max(100, 'Pays trop long').default('France'),
  latitude: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().min(-90, 'Latitude doit être entre -90 et 90').max(90, 'Latitude doit être entre -90 et 90').nullable().default(null)
  ),
  longitude: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().min(-180, 'Longitude doit être entre -180 et 180').max(180, 'Longitude doit être entre -180 et 180').nullable().default(null)
  ),
  offer_tier: z.enum(['ESSENTIEL', 'SERENITE', 'SIGNATURE']).default('ESSENTIEL'),
  lockbox_code: z.string().max(50, 'Code trop long').default(''),
  wifi_name: z.string().max(100, 'Nom WiFi trop long').default(''),
  wifi_password: z.string().max(100, 'Mot de passe WiFi trop long').default(''),
  bedrooms: nullableNumber,
  beds: nullableNumber,
  max_guests: nullableNumber,
  ical_url: z.string().url('URL invalide').refine(
    (url) => /^https?:\/\//i.test(url),
    { message: 'Seules les URLs HTTP/HTTPS sont autorisées' }
  ).or(z.literal('')).default(''),
  menage_price: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().min(0, 'Le prix doit être positif').max(10000, 'Prix trop élevé (10 000€ max)').nullable().default(null)
  ),
  tags: z.array(z.string().max(50, 'Tag trop long')).max(20, 'Maximum 20 tags').default([]),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
  status: z.enum(['ACTIF', 'PAUSE', 'ARCHIVE']).default('ACTIF'),
});
export type LogementFormData = z.infer<typeof logementSchema>;

// Missions
export const missionSchema = z.object({
  logement_id: z.string().min(1, 'Logement requis'),
  assigned_to: z.string().default(''),
  type: z.enum(['CHECKIN', 'CHECKOUT', 'MENAGE', 'INTERVENTION', 'URGENCE']),
  status: z.enum(['A_FAIRE', 'EN_COURS', 'TERMINE', 'ANNULE']).default('A_FAIRE'),
  priority: z.enum(['NORMALE', 'HAUTE', 'CRITIQUE']).default('NORMALE'),
  scheduled_date: z.string().min(1, 'Date requise'),
  scheduled_time: timeString.default('09:00'),
  time_spent_minutes: z.coerce.number().optional(),
  notes: z.string().max(5000, 'Notes trop longues (5000 caractères max)').default(''),
});
export type MissionFormData = z.infer<typeof missionSchema>;

// Prestataires
export const prestataireSchema = z.object({
  full_name: z.string().min(1, 'Nom requis').max(200, 'Nom trop long (200 caractères max)'),
  specialty: z.enum(['MENAGE', 'PLOMBERIE', 'ELECTRICITE', 'CLIM', 'AUTRE']).default('AUTRE'),
  statut_juridique: z.enum(['PARTICULIER', 'SCI', 'SARL', 'SAS', 'EURL', 'AUTRE']).default('AUTRE'),
  siret: z.string().max(14, 'SIRET trop long (14 caractères max)').default(''),
  phone: z.string().max(20, 'Numéro trop long').default(''),
  email: z.string().email('Email invalide').or(z.literal('')).default(''),
  address_line1: z.string().max(500, 'Adresse trop longue').default(''),
  postal_code: z.string().max(20, 'Code postal trop long').default(''),
  city: z.string().max(200, 'Ville trop longue').default(''),
  zone: z.string().max(100, 'Zone trop longue').default(''),
  hourly_rate: z.coerce.number().min(0, 'Le taux horaire doit être positif').max(10000, 'Taux horaire trop élevé').nullable().default(null),
  reliability_score: z.coerce.number().min(1, 'Score minimum 1').max(5, 'Score maximum 5').nullable().default(null),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
});
export type PrestataireFormData = z.infer<typeof prestataireSchema>;

// Incidents
export const incidentSchema = z.object({
  logement_id: z.string().min(1, 'Logement requis'),
  mission_id: z.string().default(''),
  prestataire_id: z.string().default(''),
  severity: z.enum(['MINEUR', 'MOYEN', 'CRITIQUE']).default('MINEUR'),
  status: z.enum(['OUVERT', 'EN_COURS', 'RESOLU', 'CLOS']).default('OUVERT'),
  category: z.enum(['PLOMBERIE', 'ELECTRICITE', 'SERRURERIE', 'NUISIBLES', 'MENAGE', 'BRUIT', 'EQUIPEMENT', 'AUTRE']).default('AUTRE'),
  description: z.string().min(1, 'Description requise').max(5000, 'Description trop longue (5000 caractères max)'),
  cost: z.coerce.number().min(0, 'Le coût doit être positif').nullable().default(null),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
  expected_resolution_date: z.string().default(''),
});
export type IncidentFormData = z.infer<typeof incidentSchema>;

// Contrats
export const contratSchema = z.object({
  proprietaire_id: z.string().min(1, 'Propriétaire requis'),
  logement_id: z.string().default(''),
  type: z.enum(['EXCLUSIF', 'SIMPLE']).default('SIMPLE'),
  start_date: z.string().min(1, 'Date de début requise'),
  end_date: z.string().min(1, 'Date de fin requise'),
  commission_rate: z.coerce.number().min(0, 'La commission doit être positive').max(100, 'La commission ne peut pas dépasser 100%'),
  status: z.enum(['ACTIF', 'EXPIRE', 'RESILIE', 'SIGNE']).default('ACTIF'),
  conditions: z.string().max(10000, 'Conditions trop longues').default(''),
  auto_renew: z.boolean().default(false),
  renewal_duration_months: z.coerce.number().int().min(1).max(120).default(12),
}).refine((data) => new Date(data.start_date) < new Date(data.end_date), {
  message: 'La date de fin doit être après la date de début',
  path: ['end_date'],
});
export type ContratFormData = z.infer<typeof contratSchema>;

// Reservations
export const reservationSchema = z.object({
  logement_id: z.string().min(1, 'Logement requis'),
  guest_name: z.string().min(1, 'Nom du voyageur requis').max(200, 'Nom trop long (200 caractères max)'),
  guest_email: z.string().email('Email invalide').or(z.literal('')).default(''),
  guest_phone: z.string().max(30, 'Numéro trop long').default(''),
  guest_count: z.coerce.number().int('Nombre entier requis').min(1, 'Minimum 1 voyageur').max(50, 'Maximum 50 voyageurs').default(1),
  check_in_date: z.string().min(1, 'Date d\'arrivée requise'),
  check_in_time: timeString.default('15:00'),
  check_out_date: z.string().min(1, 'Date de départ requise'),
  check_out_time: timeString.default('11:00'),
  platform: z.enum(['AIRBNB', 'BOOKING', 'DIRECT', 'AUTRE']).default('DIRECT'),
  amount: z.coerce.number().min(0, 'Le montant doit être positif').nullable().default(null),
  status: z.enum(['EN_ATTENTE', 'CONFIRMEE', 'ANNULEE', 'TERMINEE']).default('CONFIRMEE'),
  payment_status: z.enum(['EN_ATTENTE', 'PARTIEL', 'PAYE', 'REMBOURSE']).default('EN_ATTENTE'),
  payment_date: z.string().default(''),
  source: z.string().max(200, 'Source trop longue').default(''),
  notes: z.string().max(5000, 'Notes trop longues (5000 caractères max)').default(''),
  access_instructions: z.string().max(5000, 'Instructions trop longues (5000 caractères max)').default(''),
}).refine((data) => new Date(data.check_in_date) < new Date(data.check_out_date), {
  message: 'La date de départ doit être après la date d\'arrivée',
  path: ['check_out_date'],
});
export type ReservationFormData = z.infer<typeof reservationSchema>;

// Pricing Seasons
export const pricingSeasonSchema = z.object({
  logement_id: z.string().min(1, 'Logement requis'),
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long'),
  start_month: z.coerce.number().int().min(1).max(12),
  end_month: z.coerce.number().int().min(1).max(12),
  price_per_night: z.coerce.number().min(0, 'Le prix doit être positif').max(100000, 'Prix trop élevé'),
});
export type PricingSeasonFormData = z.infer<typeof pricingSeasonSchema>;

// Operator Capabilities (for auto-assignment)
export const operatorCapabilitiesSchema = z.object({
  mission_types: z.array(z.enum(['CHECKIN', 'CHECKOUT', 'MENAGE', 'INTERVENTION', 'URGENCE'])),
  zones: z.array(z.string()),
});

// Bulk Assignment
export const bulkAssignmentSchema = z.object({
  mission_ids: z.array(z.string().uuid()).min(1, 'Au moins une mission doit être sélectionnée').max(100, 'Maximum 100 missions à la fois'),
  operator_id: z.string().uuid('Opérateur invalide'),
});

export const autoAssignmentSchema = z.object({
  mission_ids: z.array(z.string().uuid()).min(1, 'Au moins une mission doit être sélectionnée').max(100, 'Maximum 100 missions à la fois'),
});

// Mission Comments (MI1)
export const missionCommentSchema = z.object({
  mission_id: z.string().uuid('Mission invalide'),
  content: z.string().min(1, 'Commentaire requis').max(5000, 'Commentaire trop long (5000 caractères max)'),
});
export type MissionCommentFormData = z.infer<typeof missionCommentSchema>;

// Mission Recurrences (MI4)
export const missionRecurrenceSchema = z.object({
  logement_id: z.string().min(1, 'Logement requis'),
  type: z.enum(['CHECKIN', 'CHECKOUT', 'MENAGE', 'INTERVENTION', 'URGENCE']),
  frequency: z.enum(['HEBDOMADAIRE', 'BIMENSUEL', 'MENSUEL']),
  day_of_week: z.coerce.number().int().min(0).max(6).nullable().default(null),
  day_of_month: z.coerce.number().int().min(1).max(31).nullable().default(null),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format horaire invalide').default('09:00'),
  assigned_to: z.string().default(''),
  priority: z.enum(['NORMALE', 'HAUTE', 'CRITIQUE']).default('NORMALE'),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
  active: z.boolean().default(true),
});
export type MissionRecurrenceFormData = z.infer<typeof missionRecurrenceSchema>;

// SLA Configs (MI9 + IN6)
export const slaConfigSchema = z.object({
  entity_type: z.enum(['MISSION', 'INCIDENT']),
  subtype: z.string().min(1, 'Type requis'),
  max_hours: z.coerce.number().int().min(1, 'Minimum 1 heure').max(8760, 'Maximum 1 an'),
});
export type SlaConfigFormData = z.infer<typeof slaConfigSchema>;

// Message Templates (R3 + NO6)
export const messageTemplateSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200, 'Nom trop long'),
  subject: z.string().max(500, 'Sujet trop long').default(''),
  body: z.string().min(1, 'Contenu requis').max(10000, 'Contenu trop long'),
  type: z.enum(['CONFIRMATION', 'RAPPEL', 'REMERCIEMENT', 'ACCES', 'CUSTOM']).default('CUSTOM'),
  channel: z.enum(['EMAIL', 'SMS']).default('EMAIL'),
  active: z.boolean().default(true),
  trigger_event: z.string().max(50, 'Déclencheur trop long').default(''),
});
export type MessageTemplateFormData = z.infer<typeof messageTemplateSchema>;

// Send Guest Message (R3)
export const sendGuestMessageSchema = z.object({
  reservation_id: z.string().uuid('Réservation invalide'),
  template_id: z.string().default(''),
  channel: z.enum(['EMAIL', 'SMS']).default('EMAIL'),
  subject: z.string().max(500, 'Sujet trop long').default(''),
  body: z.string().min(1, 'Message requis').max(10000, 'Message trop long'),
});
export type SendGuestMessageFormData = z.infer<typeof sendGuestMessageSchema>;

// Voyageur CRM (R15)
export const voyageurSchema = z.object({
  full_name: z.string().min(1, 'Nom requis').max(200, 'Nom trop long (200 caractères max)'),
  email: z.string().email('Email invalide').or(z.literal('')).default(''),
  phone: z.string().max(30, 'Numéro trop long').default(''),
  language: z.string().max(10, 'Langue trop longue').default(''),
  nationality: z.string().max(100, 'Nationalité trop longue').default(''),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
  tags: z.array(z.string().max(50, 'Tag trop long')).max(20, 'Maximum 20 tags').default([]),
});
export type VoyageurFormData = z.infer<typeof voyageurSchema>;

// Helper: transform empty string to null (for optional UUID foreign keys)
const nullableUuid = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? null : val),
  z.string().uuid().nullable().default(null)
);

// Devis Prestataire (IN8)
export const devisSchema = z.object({
  prestataire_id: z.string().min(1, 'Prestataire requis'),
  incident_id: nullableUuid,
  mission_id: nullableUuid,
  montant: z.coerce.number().min(0, 'Le montant doit être positif'),
  description: z.string().min(1, 'Description requise').max(5000, 'Description trop longue'),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
});
export type DevisFormData = z.infer<typeof devisSchema>;

// Facture Prestataire (IN8)
export const factureSchema = z.object({
  prestataire_id: z.string().min(1, 'Prestataire requis'),
  devis_id: nullableUuid,
  mission_id: nullableUuid,
  incident_id: nullableUuid,
  numero_facture: z.string().max(100, 'Numéro trop long').default(''),
  montant: z.coerce.number().min(0, 'Le montant doit être positif'),
  date_emission: z.string().min(1, 'Date requise'),
  date_echeance: z.string().default(''),
  description: z.string().max(5000, 'Description trop longue').default(''),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
});
export type FactureFormData = z.infer<typeof factureSchema>;

// ── Sprint 5 Schemas ──────────────────────────────────────────

// État des lieux (R17)
export const etatDesLieuxSchema = z.object({
  logement_id: z.string().min(1, 'Logement requis'),
  reservation_id: z.string().default(''),
  type: z.enum(['ENTREE', 'SORTIE']),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
});
export type EtatDesLieuxFormData = z.infer<typeof etatDesLieuxSchema>;

export const etatDesLieuxItemSchema = z.object({
  room: z.string().min(1, 'Pièce requise').max(100),
  element: z.string().min(1, 'Élément requis').max(200),
  condition: z.enum(['BON', 'CORRECT', 'DEGRADE', 'MAUVAIS']),
  notes: z.string().max(1000).default(''),
});
export type EtatDesLieuxItemFormData = z.infer<typeof etatDesLieuxItemSchema>;

// Mission Report (MI10)
export const missionReportSchema = z.object({
  mission_id: z.string().uuid('Mission invalide'),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
  issues_found: z.string().max(5000, 'Description trop longue').default(''),
});
export type MissionReportFormData = z.infer<typeof missionReportSchema>;

// Mission Template (MI17)
export const missionTemplateSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200, 'Nom trop long'),
  type: z.enum(['CHECKIN', 'CHECKOUT', 'MENAGE', 'INTERVENTION', 'URGENCE']),
  logement_id: z.string().default(''),
  description: z.string().max(5000, 'Description trop longue').default(''),
  estimated_duration_minutes: nullableNumber,
  priority: z.enum(['NORMALE', 'HAUTE', 'CRITIQUE']).default('NORMALE'),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
});
export type MissionTemplateFormData = z.infer<typeof missionTemplateSchema>;

// Webhook Endpoint (MI18 + R22)
export const webhookEndpointSchema = z.object({
  url: z.string().url('URL invalide'),
  events: z.array(z.string()).min(1, 'Au moins un événement requis'),
  description: z.string().max(500, 'Description trop longue').default(''),
  active: z.boolean().default(true),
});
export type WebhookEndpointFormData = z.infer<typeof webhookEndpointSchema>;

// Intervention Checklist (IN12)
export const interventionChecklistSchema = z.object({
  incident_id: z.string().uuid('Incident invalide'),
  items: z.array(z.object({
    label: z.string().min(1, 'Libellé requis'),
    checked: z.boolean().default(false),
    note: z.string().max(500).optional(),
  })).min(1, 'Au moins un élément requis'),
});
export type InterventionChecklistFormData = z.infer<typeof interventionChecklistSchema>;

// Contract Template (CO7)
export const contratTemplateSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200, 'Nom trop long'),
  content: z.string().min(1, 'Contenu requis').max(50000, 'Contenu trop long'),
  category: z.string().max(50, 'Catégorie trop longue').default('GENERAL'),
});
export type ContratTemplateFormData = z.infer<typeof contratTemplateSchema>;

// Owner Payment (FI8)
export const ownerPaymentSchema = z.object({
  proprietaire_id: z.string().min(1, 'Propriétaire requis'),
  contrat_id: z.string().default(''),
  amount: z.coerce.number().min(0, 'Le montant doit être positif'),
  period_start: z.string().default(''),
  period_end: z.string().default(''),
  notes: z.string().max(5000, 'Notes trop longues').default(''),
});
export type OwnerPaymentFormData = z.infer<typeof ownerPaymentSchema>;

// Prestataire Document (PR7)
export const prestataireDocumentSchema = z.object({
  prestataire_id: z.string().min(1, 'Prestataire requis'),
  type: z.enum(['CERTIFICATION', 'ASSURANCE', 'KBIS', 'RIB', 'AUTRE']),
  name: z.string().min(1, 'Nom requis').max(200, 'Nom trop long'),
  file_url: z.string().min(1, 'Fichier requis'),
  expires_at: z.string().default(''),
  notes: z.string().max(1000, 'Notes trop longues').default(''),
});
export type PrestataireDocumentFormData = z.infer<typeof prestataireDocumentSchema>;

// Proprietaire Document (PO6)
export const proprietaireDocumentSchema = z.object({
  proprietaire_id: z.string().min(1, 'Propriétaire requis'),
  type: z.enum(['IDENTITE', 'DIAGNOSTIC', 'TITRE_PROPRIETE', 'ASSURANCE', 'RIB', 'AUTRE']),
  name: z.string().min(1, 'Nom requis').max(200, 'Nom trop long'),
  file_url: z.string().min(1, 'Fichier requis'),
  expires_at: z.string().default(''),
  notes: z.string().max(1000, 'Notes trop longues').default(''),
});
export type ProprietaireDocumentFormData = z.infer<typeof proprietaireDocumentSchema>;

// ── Sprint 6 Schemas ──────────────────────────────────────────

// Marketplace Bid (MI13)
export const marketplaceBidSchema = z.object({
  prestataire_id: z.string().min(1, 'Prestataire requis'),
  mission_id: z.string().default(''),
  incident_id: z.string().default(''),
  proposed_price: z.coerce.number().min(0, 'Le prix doit être positif'),
  message: z.string().max(2000, 'Message trop long').default(''),
});
export type MarketplaceBidFormData = z.infer<typeof marketplaceBidSchema>;

// Stock Movement (MI16)
export const stockMovementSchema = z.object({
  equipement_id: z.string().min(1, 'Équipement requis'),
  type: z.enum(['ENTREE', 'SORTIE', 'AJUSTEMENT']),
  quantite: z.coerce.number().int('Quantité entière requise').min(1, 'Minimum 1'),
  mission_id: z.string().default(''),
  notes: z.string().max(1000, 'Notes trop longues').default(''),
});
export type StockMovementFormData = z.infer<typeof stockMovementSchema>;

// Preventive Schedule (IN13)
export const preventiveScheduleSchema = z.object({
  logement_id: z.string().min(1, 'Logement requis'),
  title: z.string().min(1, 'Titre requis').max(200, 'Titre trop long'),
  description: z.string().max(2000, 'Description trop longue').default(''),
  category: z.enum(['PLOMBERIE', 'ELECTRICITE', 'SERRURERIE', 'NUISIBLES', 'MENAGE', 'BRUIT', 'EQUIPEMENT', 'AUTRE']).default('AUTRE'),
  severity: z.enum(['MINEUR', 'MOYEN', 'CRITIQUE']).default('MINEUR'),
  frequency: z.enum(['HEBDOMADAIRE', 'BIMENSUEL', 'MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL']),
  day_of_week: z.coerce.number().int().min(0).max(6).nullable().default(null),
  day_of_month: z.coerce.number().int().min(1).max(31).nullable().default(null),
  next_due_date: z.string().min(1, 'Date requise'),
  notes: z.string().max(2000, 'Notes trop longues').default(''),
  active: z.boolean().default(true),
});
export type PreventiveScheduleFormData = z.infer<typeof preventiveScheduleSchema>;

// Warranty (IN15)
export const warrantySchema = z.object({
  logement_id: z.string().default(''),
  equipement_id: z.string().default(''),
  type: z.enum(['GARANTIE', 'ASSURANCE']),
  provider: z.string().min(1, 'Fournisseur requis').max(200, 'Nom trop long'),
  policy_number: z.string().max(100, 'Numéro trop long').default(''),
  start_date: z.string().min(1, 'Date de début requise'),
  end_date: z.string().min(1, 'Date de fin requise'),
  coverage_details: z.string().max(5000, 'Détails trop longs').default(''),
  annual_cost: z.coerce.number().min(0).nullable().default(null),
  contact_info: z.string().max(500, 'Contact trop long').default(''),
  document_url: z.string().default(''),
  alert_days_before: z.coerce.number().int().min(1).max(365).default(30),
  notes: z.string().max(2000, 'Notes trop longues').default(''),
});
export type WarrantyFormData = z.infer<typeof warrantySchema>;

// Platform Payment (FI9)
export const platformPaymentSchema = z.object({
  platform: z.enum(['AIRBNB', 'BOOKING', 'DIRECT', 'AUTRE']),
  reference: z.string().max(200, 'Référence trop longue').default(''),
  amount: z.coerce.number().min(0, 'Le montant doit être positif'),
  payment_date: z.string().min(1, 'Date requise'),
  reservation_id: z.string().default(''),
  notes: z.string().max(2000, 'Notes trop longues').default(''),
});
export type PlatformPaymentFormData = z.infer<typeof platformPaymentSchema>;

// Budget (FI10)
export const budgetSchema = z.object({
  logement_id: z.string().default(''),
  year: z.coerce.number().int().min(2020).max(2040),
  month: z.coerce.number().int().min(0).max(12).nullable().default(null),
  category: z.enum(['GLOBAL', 'REVENUS', 'CHARGES', 'MAINTENANCE']).default('GLOBAL'),
  amount: z.coerce.number().min(0, 'Le montant doit être positif'),
  notes: z.string().max(1000, 'Notes trop longues').default(''),
});
export type BudgetFormData = z.infer<typeof budgetSchema>;

// TVA Config (FI11)
export const tvaConfigSchema = z.object({
  label: z.string().min(1, 'Libellé requis').max(100, 'Libellé trop long'),
  rate: z.coerce.number().min(0, 'Le taux doit être positif').max(100, 'Maximum 100%'),
  is_default: z.boolean().default(false),
});
export type TvaConfigFormData = z.infer<typeof tvaConfigSchema>;

// Exchange Rate (FI13)
export const exchangeRateSchema = z.object({
  from_currency: z.string().length(3, 'Code devise 3 caractères'),
  to_currency: z.string().length(3, 'Code devise 3 caractères'),
  rate: z.coerce.number().min(0.000001, 'Le taux doit être positif'),
  effective_date: z.string().min(1, 'Date requise'),
});
export type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>;

// Contrat Logement (CO9)
export const contratLogementSchema = z.object({
  logement_id: z.string().min(1, 'Logement requis'),
  commission_rate: z.coerce.number().min(0, 'Commission positive').max(100, 'Maximum 100%'),
  notes: z.string().max(500, 'Notes trop longues').default(''),
});
export type ContratLogementFormData = z.infer<typeof contratLogementSchema>;

// Prestataire Availability (PR4)
export const prestataireAvailabilitySchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
});
export type PrestataireAvailabilityFormData = z.infer<typeof prestataireAvailabilitySchema>;

// Prestataire Blackout (PR4)
export const prestataireBlackoutSchema = z.object({
  start_date: z.string().min(1, 'Date de début requise'),
  end_date: z.string().min(1, 'Date de fin requise'),
  reason: z.string().max(500, 'Raison trop longue').default(''),
});
export type PrestataireBlackoutFormData = z.infer<typeof prestataireBlackoutSchema>;
