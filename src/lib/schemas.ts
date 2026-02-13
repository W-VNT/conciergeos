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
  offer_tier: z.enum(['ESSENTIEL', 'SERENITE', 'SIGNATURE']).default('ESSENTIEL'),
  lockbox_code: z.string().default(''),
  wifi_name: z.string().default(''),
  wifi_password: z.string().default(''),
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
