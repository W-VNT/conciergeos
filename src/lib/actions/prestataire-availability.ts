'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile, isAdminOrManager } from '@/lib/auth';

export async function getAvailability(prestataireId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [slotsRes, blackoutsRes] = await Promise.all([
    supabase
      .from('prestataire_availability')
      .select('*')
      .eq('organisation_id', profile.organisation_id)
      .eq('prestataire_id', prestataireId)
      .order('day_of_week')
      .order('start_time'),
    supabase
      .from('prestataire_blackouts')
      .select('*')
      .eq('organisation_id', profile.organisation_id)
      .eq('prestataire_id', prestataireId)
      .order('start_date'),
  ]);
  return {
    slots: slotsRes.data || [],
    blackouts: blackoutsRes.data || [],
  };
}

export async function addAvailabilitySlot(data: {
  prestataire_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase.from('prestataire_availability').insert({
    organisation_id: profile.organisation_id,
    prestataire_id: data.prestataire_id,
    day_of_week: data.day_of_week,
    start_time: data.start_time,
    end_time: data.end_time,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Créneau ajouté' };
}

export async function removeAvailabilitySlot(id: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('prestataire_availability')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addBlackout(data: {
  prestataire_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase.from('prestataire_blackouts').insert({
    organisation_id: profile.organisation_id,
    prestataire_id: data.prestataire_id,
    start_date: data.start_date,
    end_date: data.end_date,
    reason: data.reason || '',
  });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Indisponibilité ajoutée' };
}

export async function removeBlackout(id: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('prestataire_blackouts')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function isPrestataireAvailable(prestataireId: string, date: string, startTime?: string): Promise<boolean> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: blackouts } = await supabase
    .from('prestataire_blackouts')
    .select('id')
    .eq('organisation_id', profile.organisation_id)
    .eq('prestataire_id', prestataireId)
    .lte('start_date', date)
    .gte('end_date', date)
    .limit(1);
  if (blackouts && blackouts.length > 0) return false;

  const dayOfWeek = new Date(date).getDay();
  const { data: slots } = await supabase
    .from('prestataire_availability')
    .select('*')
    .eq('organisation_id', profile.organisation_id)
    .eq('prestataire_id', prestataireId)
    .eq('day_of_week', dayOfWeek);

  if (!slots || slots.length === 0) return true;
  if (startTime) {
    return slots.some((s: any) => startTime >= s.start_time && startTime <= s.end_time);
  }
  return true;
}
