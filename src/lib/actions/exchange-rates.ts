'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile, isAdminOrManager } from '@/lib/auth';
import type { ExchangeRate } from '@/types/database';
import type { ExchangeRateFormData } from '@/lib/schemas';

export async function getExchangeRates() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('organisation_id', profile.organisation_id)
    .order('effective_date', { ascending: false });
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data as ExchangeRate[] };
}

export async function createExchangeRate(formData: ExchangeRateFormData) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  // Validate rate bounds (reasonable exchange rates)
  if (formData.rate <= 0 || formData.rate > 10000) {
    return { success: false, error: 'Taux de change invalide (doit être entre 0 et 10000)' };
  }
  if (formData.from_currency === formData.to_currency) {
    return { success: false, error: 'Les devises source et cible doivent être différentes' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('exchange_rates').upsert({
    organisation_id: profile.organisation_id,
    from_currency: formData.from_currency,
    to_currency: formData.to_currency,
    rate: formData.rate,
    effective_date: formData.effective_date,
  }, { onConflict: 'organisation_id,from_currency,to_currency,effective_date' });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Taux enregistré' };
}

export async function deleteExchangeRate(id: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('exchange_rates')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function convertToEur(amount: number, currency: string, date?: string): Promise<number> {
  if (currency === 'EUR') return amount;
  const profile = await requireProfile();
  const supabase = await createClient();

  const effectiveDate = date || new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('organisation_id', profile.organisation_id)
    .eq('from_currency', currency)
    .eq('to_currency', 'EUR')
    .lte('effective_date', effectiveDate)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  if (data) return Math.round(amount * Number(data.rate) * 100) / 100;
  return amount; // No rate found, return as-is
}
