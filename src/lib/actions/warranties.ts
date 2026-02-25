'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile, isAdminOrManager } from '@/lib/auth';
import type { Warranty } from '@/types/database';
import type { WarrantyFormData } from '@/lib/schemas';

export async function getWarranties(logementId?: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  let query = supabase
    .from('warranties')
    .select('*, logement:logements(id, name)')
    .eq('organisation_id', profile.organisation_id)
    .order('end_date', { ascending: true });
  if (logementId) query = query.eq('logement_id', logementId);
  const { data, error } = await query;
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data as Warranty[] };
}

export async function createWarranty(formData: WarrantyFormData) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase.from('warranties').insert({
    organisation_id: profile.organisation_id,
    logement_id: formData.logement_id || null,
    equipement_id: formData.equipement_id || null,
    type: formData.type,
    provider: formData.provider,
    policy_number: formData.policy_number || '',
    start_date: formData.start_date,
    end_date: formData.end_date,
    coverage_details: formData.coverage_details || '',
    annual_cost: formData.annual_cost ?? null,
    contact_info: formData.contact_info || '',
    alert_days_before: formData.alert_days_before ?? 30,
    notes: formData.notes || '',
  });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Garantie/Assurance créée' };
}

export async function updateWarranty(id: string, formData: Partial<WarrantyFormData>) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('warranties')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Mise à jour effectuée' };
}

export async function deleteWarranty(id: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('warranties')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Supprimée' };
}

export async function getExpiringWarranties(daysAhead: number = 30) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('warranties')
    .select('*, logement:logements(id, name)')
    .eq('organisation_id', profile.organisation_id)
    .lte('end_date', futureDate.toISOString().slice(0, 10))
    .gte('end_date', new Date().toISOString().slice(0, 10))
    .order('end_date', { ascending: true });
  if (error) return [];
  return data || [];
}
