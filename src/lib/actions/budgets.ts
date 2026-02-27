'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile, isAdminOrManager } from '@/lib/auth';
import type { Budget } from '@/types/database';
import type { BudgetFormData } from '@/lib/schemas';

export async function getBudgets(year: number, logementId?: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  let query = supabase
    .from('budgets')
    .select('*, logement:logements(id, name)')
    .eq('organisation_id', profile.organisation_id)
    .eq('year', year)
    .order('month')
    .order('category');
  if (logementId) query = query.eq('logement_id', logementId);
  const { data, error } = await query;
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data as Budget[] };
}

export async function upsertBudget(formData: BudgetFormData) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase.from('budgets').upsert({
    organisation_id: profile.organisation_id,
    logement_id: formData.logement_id || null,
    year: formData.year,
    month: formData.month ?? null,
    category: formData.category || 'GLOBAL',
    amount: formData.amount,
    notes: formData.notes || '',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'organisation_id,logement_id,year,month,category' });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Budget enregistré' };
}

export async function deleteBudget(id: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getBudgetVsActual(year: number) {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Get budgets for the year
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .eq('organisation_id', profile.organisation_id)
    .eq('year', year)
    .is('logement_id', null)
    .eq('category', 'GLOBAL');

  // Get actual revenues by month (revenus table tracks all revenue, no type column)
  const { data: revenus } = await supabase
    .from('revenus')
    .select('montant_brut, montant_commission, created_at')
    .eq('organisation_id', profile.organisation_id)
    .gte('created_at', `${year}-01-01`)
    .lte('created_at', `${year}-12-31`);

  const monthlyData: { month: number; budget: number; actual_revenus: number; actual_charges: number; variance: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const budgetEntry = (budgets || []).find((b: any) => b.month === m);
    const monthRevenus = (revenus || []).filter((r: any) => {
      const d = new Date(r.created_at);
      return d.getMonth() + 1 === m;
    });
    const rev = monthRevenus.reduce((s: number, r: any) => s + Number(r.montant_brut || 0), 0);
    const charges = monthRevenus.reduce((s: number, r: any) => s + Number(r.montant_commission || 0), 0);
    const budget = budgetEntry ? Number(budgetEntry.amount) : 0;
    monthlyData.push({ month: m, budget, actual_revenus: rev, actual_charges: charges, variance: rev - budget });
  }

  return monthlyData;
}

export async function getForecast(monthsAhead: number = 6) {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Get last 6 months of revenue
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: revenus } = await supabase
    .from('revenus')
    .select('montant_brut, created_at')
    .eq('organisation_id', profile.organisation_id)
    .gte('created_at', sixMonthsAgo.toISOString());

  const totalRevenue = (revenus || []).reduce((s: number, r: any) => s + Number(r.montant_brut || 0), 0);
  const avgMonthly = totalRevenue / 6;

  const forecast: { year: number; month: number; projected: number }[] = [];
  const now = new Date();
  for (let i = 1; i <= monthsAhead; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + i);
    forecast.push({ year: d.getFullYear(), month: d.getMonth() + 1, projected: Math.round(avgMonthly) });
  }

  return { avgMonthly: Math.round(avgMonthly), forecast };
}
