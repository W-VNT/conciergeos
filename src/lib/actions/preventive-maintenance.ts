'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile, isAdminOrManager } from '@/lib/auth';
import type { PreventiveSchedule } from '@/types/database';
import type { PreventiveScheduleFormData } from '@/lib/schemas';

export async function getPreventiveSchedules(logementId?: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  let query = supabase
    .from('preventive_schedules')
    .select('*, logement:logements(id, name)')
    .eq('organisation_id', profile.organisation_id)
    .order('next_due_date', { ascending: true });
  if (logementId) query = query.eq('logement_id', logementId);
  const { data, error } = await query;
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data as PreventiveSchedule[] };
}

export async function createPreventiveSchedule(formData: PreventiveScheduleFormData) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase.from('preventive_schedules').insert({
    organisation_id: profile.organisation_id,
    logement_id: formData.logement_id,
    title: formData.title,
    description: formData.description || '',
    category: formData.category || 'AUTRE',
    severity: formData.severity || 'MINEUR',
    frequency: formData.frequency,
    day_of_week: formData.day_of_week ?? null,
    day_of_month: formData.day_of_month ?? null,
    next_due_date: formData.next_due_date,
    notes: formData.notes || '',
  });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Planification créée' };
}

export async function updatePreventiveSchedule(id: string, formData: Partial<PreventiveScheduleFormData>) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('preventive_schedules')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Planification mise à jour' };
}

export async function deletePreventiveSchedule(id: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('preventive_schedules')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Planification supprimée' };
}

export async function toggleScheduleActive(id: string, active: boolean) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('preventive_schedules')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function generateDueIncidents() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: schedules } = await supabase
    .from('preventive_schedules')
    .select('*')
    .eq('organisation_id', profile.organisation_id)
    .eq('active', true)
    .lte('next_due_date', today);

  if (!schedules || schedules.length === 0) return { success: true, generated: 0 };

  let generated = 0;
  for (const s of schedules) {
    const { error } = await supabase.from('incidents').insert({
      organisation_id: profile.organisation_id,
      logement_id: s.logement_id,
      title: `[Préventif] ${s.title}`,
      description: s.description || '',
      category: s.category || 'AUTRE',
      severity: s.severity,
      status: 'OUVERT',
    });
    if (!error) {
      generated++;
      const next = computeNextDate(s.next_due_date, s.frequency, s.day_of_month);
      await supabase.from('preventive_schedules').update({
        next_due_date: next,
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', s.id);
    }
  }

  return { success: true, generated, message: `${generated} incident(s) créé(s)` };
}

function computeNextDate(currentDate: string, frequency: string, dayOfMonth?: number | null): string {
  const d = new Date(currentDate);
  switch (frequency) {
    case 'HEBDOMADAIRE': d.setDate(d.getDate() + 7); break;
    case 'BIMENSUEL': d.setDate(d.getDate() + 14); break;
    case 'MENSUEL': d.setMonth(d.getMonth() + 1); break;
    case 'TRIMESTRIEL': d.setMonth(d.getMonth() + 3); break;
    case 'SEMESTRIEL': d.setMonth(d.getMonth() + 6); break;
    case 'ANNUEL': d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  if (dayOfMonth && ['MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL'].includes(frequency)) {
    d.setDate(Math.min(dayOfMonth, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  }
  return d.toISOString().slice(0, 10);
}
