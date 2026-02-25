'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile, isAdminOrManager } from '@/lib/auth';
import type { TvaConfig } from '@/types/database';
import type { TvaConfigFormData } from '@/lib/schemas';

export async function getTvaConfigs() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tva_configs')
    .select('*')
    .eq('organisation_id', profile.organisation_id)
    .order('rate');
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data as TvaConfig[] };
}

export async function createTvaConfig(formData: TvaConfigFormData) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase.from('tva_configs').insert({
    organisation_id: profile.organisation_id,
    label: formData.label,
    rate: formData.rate,
    is_default: formData.is_default ?? false,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Taux TVA créé' };
}

export async function deleteTvaConfig(id: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('tva_configs')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getTvaSummary(startDate: string, endDate: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: revenus } = await supabase
    .from('revenus')
    .select('montant_brut, tva_rate, tva_amount')
    .eq('organisation_id', profile.organisation_id)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  let totalHT = 0;
  let totalTVA = 0;
  const byRate = new Map<number, { ht: number; tva: number; count: number }>();

  for (const r of revenus || []) {
    const tvaRate = Number(r.tva_rate || 0);
    const tvaAmount = Number(r.tva_amount || 0);
    const ht = Number(r.montant_brut || 0) - tvaAmount;
    totalHT += ht;
    totalTVA += tvaAmount;

    const entry = byRate.get(tvaRate) || { ht: 0, tva: 0, count: 0 };
    entry.ht += ht;
    entry.tva += tvaAmount;
    entry.count++;
    byRate.set(tvaRate, entry);
  }

  return {
    totalHT: Math.round(totalHT * 100) / 100,
    totalTVA: Math.round(totalTVA * 100) / 100,
    totalTTC: Math.round((totalHT + totalTVA) * 100) / 100,
    byRate: Array.from(byRate.entries()).map(([rate, data]) => ({
      rate,
      ht: Math.round(data.ht * 100) / 100,
      tva: Math.round(data.tva * 100) / 100,
      count: data.count,
    })).sort((a, b) => a.rate - b.rate),
  };
}
