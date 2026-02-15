import { z } from 'zod';

// Proprietaires
export const proprietaireSchema = z.object({
  full_name: z.string().min(1, 'Nom requis'),
  phone: z.string().default(''),
  email: z.string().default(''),
  service_level: z.enum(['STANDARD', 'VIP']).default('STANDARD'),
  notes: z.string().default(''),
});
export type ProprietaireFormData = z.infer<typeof proprietaireSchema>;

// Logements
export const logementSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  owner_id: z.string().default(''),
  address_line1: z.string().default(''),
  city: z.string().default(''),
  postal_code: z.string().default(''),
  country: z.string().default('France'),
  latitude: z.coerce.number().nullable().default(null),
  longitude: z.coerce.number().nullable().default(null),
  offer_tier: z.enum(['ESSENTIEL', 'SERENITE', 'SIGNATURE']).default('ESSENTIEL'),
  lockbox_code: z.string().default(''),
  wifi_name: z.string().default(''),
  wifi_password: z.string().default(''),
  bedrooms: z.coerce.number().nullable().default(null),
  beds: z.coerce.number().nullable().default(null),
  max_guests: z.coerce.number().nullable().default(null),
  ical_url: z.string().url('URL invalide').or(z.literal('')).default(''),
  notes: z.string().default(''),
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
  scheduled_at: z.string().min(1, 'Date requise'),
  time_spent_minutes: z.coerce.number().optional(),
  notes: z.string().default(''),
});
export type MissionFormData = z.infer<typeof missionSchema>;

// Prestataires
export const prestataireSchema = z.object({
  full_name: z.string().min(1, 'Nom requis'),
  specialty: z.enum(['MENAGE', 'PLOMBERIE', 'ELECTRICITE', 'CLIM', 'AUTRE']).default('AUTRE'),
  phone: z.string().default(''),
  email: z.string().default(''),
  zone: z.string().default(''),
  hourly_rate: z.coerce.number().nullable().default(null),
  reliability_score: z.coerce.number().nullable().default(null),
  notes: z.string().default(''),
});
export type PrestataireFormData = z.infer<typeof prestataireSchema>;

// Incidents
export const incidentSchema = z.object({
  logement_id: z.string().min(1, 'Logement requis'),
  mission_id: z.string().default(''),
  prestataire_id: z.string().default(''),
  severity: z.enum(['MINEUR', 'MOYEN', 'CRITIQUE']).default('MINEUR'),
  status: z.enum(['OUVERT', 'EN_COURS', 'RESOLU', 'CLOS']).default('OUVERT'),
  description: z.string().min(1, 'Description requise'),
  cost: z.coerce.number().nullable().default(null),
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
  conditions: z.string().default(''),
}).refine((data) => new Date(data.start_date) < new Date(data.end_date), {
  message: 'La date de fin doit être après la date de début',
  path: ['end_date'],
});
export type ContratFormData = z.infer<typeof contratSchema>;

// Reservations
export const reservationSchema = z.object({
  logement_id: z.string().min(1, 'Logement requis'),
  guest_name: z.string().min(1, 'Nom du voyageur requis'),
  guest_email: z.string().email('Email invalide').default(''),
  guest_phone: z.string().default(''),
  guest_count: z.coerce.number().min(1, 'Minimum 1 voyageur').default(1),
  check_in_date: z.string().min(1, 'Date d\'arrivée requise'),
  check_out_date: z.string().min(1, 'Date de départ requise'),
  platform: z.enum(['AIRBNB', 'BOOKING', 'DIRECT', 'AUTRE']).default('DIRECT'),
  amount: z.coerce.number().min(0, 'Le montant doit être positif').nullable().default(null),
  status: z.enum(['CONFIRMEE', 'ANNULEE', 'TERMINEE']).default('CONFIRMEE'),
  notes: z.string().default(''),
}).refine((data) => new Date(data.check_in_date) < new Date(data.check_out_date), {
  message: 'La date de départ doit être après la date d\'arrivée',
  path: ['check_out_date'],
});
export type ReservationFormData = z.infer<typeof reservationSchema>;
