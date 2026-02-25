'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile, isAdminOrManager } from '@/lib/auth';
import type { ContratLogement } from '@/types/database';

export async function getContratLogements(contratId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contrat_logements')
    .select('*, logement:logements(id, name, address_line1, city)')
    .eq('contrat_id', contratId)
    .order('created_at');
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data as ContratLogement[] };
}

export async function addContratLogement(contratId: string, logementId: string, commissionRate: number, notes?: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase.from('contrat_logements').insert({
    contrat_id: contratId,
    logement_id: logementId,
    commission_rate: commissionRate,
    notes: notes || '',
  });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Logement ajouté au contrat' };
}

export async function updateContratLogement(id: string, commissionRate: number, notes?: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  if (commissionRate < 0 || commissionRate > 100) return { success: false, error: 'Taux de commission invalide' };
  const supabase = await createClient();
  // Verify ownership via contrat's organisation_id
  const { data: cl } = await supabase
    .from('contrat_logements')
    .select('contrat_id, contrat:contrats(organisation_id)')
    .eq('id', id)
    .single();
  const contratOrg = (cl?.contrat as any)?.organisation_id;
  if (!cl || contratOrg !== profile.organisation_id) return { success: false, error: 'Non trouvé' };
  const { error } = await supabase
    .from('contrat_logements')
    .update({ commission_rate: commissionRate, notes: notes || '' })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Commission mise à jour' };
}

export async function removeContratLogement(id: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  // Verify ownership via contrat's organisation_id
  const { data: cl } = await supabase
    .from('contrat_logements')
    .select('contrat_id, contrat:contrats(organisation_id)')
    .eq('id', id)
    .single();
  const contratOrg = (cl?.contrat as any)?.organisation_id;
  if (!cl || contratOrg !== profile.organisation_id) return { success: false, error: 'Non trouvé' };
  const { error } = await supabase
    .from('contrat_logements')
    .delete()
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Logement retiré du contrat' };
}
