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
  latitude: nullableNumber,
  longitude: nullableNumber,
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
  status: z.enum(['ACTIF', 'EXPIRE', 'RESILIE']).default('ACTIF'),
  conditions: z.string().max(10000, 'Conditions trop longues').default(''),
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
  notes: z.string().max(5000, 'Notes trop longues (5000 caractères max)').default(''),
  access_instructions: z.string().max(5000, 'Instructions trop longues (5000 caractères max)').default(''),
}).refine((data) => new Date(data.check_in_date) < new Date(data.check_out_date), {
  message: 'La date de départ doit être après la date d\'arrivée',
  path: ['check_out_date'],
});
export type ReservationFormData = z.infer<typeof reservationSchema>;

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
