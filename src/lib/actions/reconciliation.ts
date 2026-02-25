'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile, isAdminOrManager } from '@/lib/auth';
import type { PlatformPayment } from '@/types/database';
import type { PlatformPaymentFormData } from '@/lib/schemas';

export async function getPlatformPayments(filters?: { platform?: string; status?: string }) {
  const profile = await requireProfile();
  const supabase = await createClient();
  let query = supabase
    .from('platform_payments')
    .select('*, reservation:reservations(id, guest_name, check_in_date, check_out_date, amount, platform)')
    .eq('organisation_id', profile.organisation_id)
    .order('payment_date', { ascending: false });
  if (filters?.platform) query = query.eq('platform', filters.platform);
  if (filters?.status) query = query.eq('reconciliation_status', filters.status);
  const { data, error } = await query;
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data as PlatformPayment[] };
}

export async function createPlatformPayment(formData: PlatformPaymentFormData) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase.from('platform_payments').insert({
    organisation_id: profile.organisation_id,
    platform: formData.platform,
    reference: formData.reference || '',
    amount: formData.amount,
    payment_date: formData.payment_date,
    reservation_id: formData.reservation_id || null,
    notes: formData.notes || '',
  });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Paiement enregistré' };
}

export async function deletePlatformPayment(id: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('platform_payments')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Paiement supprimé' };
}

export async function autoReconcile() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from('platform_payments')
    .select('*')
    .eq('organisation_id', profile.organisation_id)
    .eq('reconciliation_status', 'NON_RAPPROCHE');

  if (!payments || payments.length === 0) return { success: true, matched: 0, message: 'Aucun paiement à rapprocher' };

  let matched = 0;
  for (const payment of payments) {
    if (payment.reservation_id) {
      const { data: reservation } = await supabase
        .from('reservations')
        .select('amount')
        .eq('id', payment.reservation_id)
        .single();
      if (reservation) {
        const ecart = payment.amount - (reservation.amount || 0);
        await supabase.from('platform_payments').update({
          reconciliation_status: Math.abs(ecart) < 0.01 ? 'RAPPROCHE' : 'ECART',
          ecart_amount: Math.abs(ecart) < 0.01 ? null : ecart,
          updated_at: new Date().toISOString(),
        }).eq('id', payment.id).eq('organisation_id', profile.organisation_id);
        matched++;
        continue;
      }
    }

    // Match by platform + amount + date range (±7 days) for tighter matching
    const paymentDate = new Date(payment.payment_date);
    const dateFrom = new Date(paymentDate);
    dateFrom.setDate(dateFrom.getDate() - 7);
    const dateTo = new Date(paymentDate);
    dateTo.setDate(dateTo.getDate() + 7);

    const { data: reservations } = await supabase
      .from('reservations')
      .select('id, amount')
      .eq('organisation_id', profile.organisation_id)
      .eq('platform', payment.platform)
      .eq('amount', payment.amount)
      .gte('check_in_date', dateFrom.toISOString().split('T')[0])
      .lte('check_in_date', dateTo.toISOString().split('T')[0])
      .limit(1);

    if (reservations && reservations.length > 0) {
      await supabase.from('platform_payments').update({
        reservation_id: reservations[0].id,
        reconciliation_status: 'RAPPROCHE',
        ecart_amount: null,
        updated_at: new Date().toISOString(),
      }).eq('id', payment.id).eq('organisation_id', profile.organisation_id);
      matched++;
    }
  }

  return { success: true, matched, message: `${matched} paiement(s) rapproché(s)` };
}

export async function getReconciliationSummary() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from('platform_payments')
    .select('reconciliation_status, amount')
    .eq('organisation_id', profile.organisation_id);

  const summary = { total: 0, totalAmount: 0, matched: 0, matchedAmount: 0, unmatched: 0, unmatchedAmount: 0, ecart: 0, ecartAmount: 0 };
  for (const p of data || []) {
    summary.total++;
    summary.totalAmount += Number(p.amount);
    if (p.reconciliation_status === 'RAPPROCHE') { summary.matched++; summary.matchedAmount += Number(p.amount); }
    else if (p.reconciliation_status === 'ECART') { summary.ecart++; summary.ecartAmount += Number(p.amount); }
    else { summary.unmatched++; summary.unmatchedAmount += Number(p.amount); }
  }
  return summary;
}
