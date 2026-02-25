'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile, isAdminOrManager } from '@/lib/auth';
import type { MarketplaceBid } from '@/types/database';

export async function toggleOpenForBids(entityType: 'mission' | 'incident', entityId: string, open: boolean) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const table = entityType === 'mission' ? 'missions' : 'incidents';
  const { error } = await supabase
    .from(table)
    .update({ open_for_bids: open, updated_at: new Date().toISOString() })
    .eq('id', entityId)
    .eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true, message: open ? 'Ouvert aux offres' : 'Fermé aux offres' };
}

export async function getOpenJobs() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [missionsRes, incidentsRes] = await Promise.all([
    supabase
      .from('missions')
      .select('id, type, logement:logements(id, name), scheduled_at, status, open_for_bids')
      .eq('organisation_id', profile.organisation_id)
      .eq('open_for_bids', true)
      .in('status', ['A_FAIRE', 'EN_COURS'])
      .order('scheduled_at'),
    supabase
      .from('incidents')
      .select('id, title, logement:logements(id, name), severity, status, open_for_bids')
      .eq('organisation_id', profile.organisation_id)
      .eq('open_for_bids', true)
      .in('status', ['OUVERT', 'EN_COURS'])
      .order('created_at', { ascending: false }),
  ]);
  return {
    missions: missionsRes.data || [],
    incidents: incidentsRes.data || [],
  };
}

export async function getBidsForEntity(entityType: 'mission' | 'incident', entityId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const column = entityType === 'mission' ? 'mission_id' : 'incident_id';
  const { data, error } = await supabase
    .from('marketplace_bids')
    .select('*, prestataire:prestataires(id, nom, specialite)')
    .eq('organisation_id', profile.organisation_id)
    .eq(column, entityId)
    .order('created_at', { ascending: false });
  if (error) return { success: false, data: [] };
  return { success: true, data: data as MarketplaceBid[] };
}

export async function createBid(data: {
  mission_id?: string;
  incident_id?: string;
  prestataire_id: string;
  proposed_price: number;
  message?: string;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Validate price bounds
  if (data.proposed_price < 0 || data.proposed_price > 1000000) {
    return { success: false, error: 'Prix proposé invalide' };
  }

  // Verify entity exists, belongs to org, and is open for bids
  if (data.mission_id) {
    const { data: mission } = await supabase
      .from('missions').select('open_for_bids')
      .eq('id', data.mission_id).eq('organisation_id', profile.organisation_id).single();
    if (!mission) return { success: false, error: 'Mission introuvable' };
    if (!mission.open_for_bids) return { success: false, error: 'Mission non ouverte aux offres' };
  } else if (data.incident_id) {
    const { data: incident } = await supabase
      .from('incidents').select('open_for_bids')
      .eq('id', data.incident_id).eq('organisation_id', profile.organisation_id).single();
    if (!incident) return { success: false, error: 'Incident introuvable' };
    if (!incident.open_for_bids) return { success: false, error: 'Incident non ouvert aux offres' };
  } else {
    return { success: false, error: 'mission_id ou incident_id requis' };
  }

  const { error } = await supabase.from('marketplace_bids').insert({
    organisation_id: profile.organisation_id,
    prestataire_id: data.prestataire_id,
    mission_id: data.mission_id || null,
    incident_id: data.incident_id || null,
    proposed_price: data.proposed_price,
    message: data.message || '',
  });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Offre soumise' };
}

export async function acceptBid(bidId: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();

  const { data: bid, error: fetchErr } = await supabase
    .from('marketplace_bids')
    .select('*')
    .eq('id', bidId)
    .eq('organisation_id', profile.organisation_id)
    .single();
  if (fetchErr || !bid) return { success: false, error: 'Offre introuvable' };

  // Accept this bid
  await supabase.from('marketplace_bids').update({
    status: 'ACCEPTE',
    responded_at: new Date().toISOString(),
    responded_by: profile.id,
    updated_at: new Date().toISOString(),
  }).eq('id', bidId);

  // Reject other bids for same entity
  const column = bid.mission_id ? 'mission_id' : 'incident_id';
  const entityId = bid.mission_id || bid.incident_id;
  await supabase.from('marketplace_bids').update({
    status: 'REFUSE',
    responded_at: new Date().toISOString(),
    responded_by: profile.id,
    updated_at: new Date().toISOString(),
  }).eq(column, entityId).neq('id', bidId).eq('status', 'EN_ATTENTE');

  // Assign prestataire to the mission/incident
  const table = bid.mission_id ? 'missions' : 'incidents';
  await supabase.from(table).update({
    prestataire_id: bid.prestataire_id,
    open_for_bids: false,
    updated_at: new Date().toISOString(),
  }).eq('id', entityId);

  return { success: true, message: 'Offre acceptée, prestataire assigné' };
}

export async function rejectBid(bidId: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  const supabase = await createClient();
  const { error } = await supabase.from('marketplace_bids').update({
    status: 'REFUSE',
    responded_at: new Date().toISOString(),
    responded_by: profile.id,
    updated_at: new Date().toISOString(),
  }).eq('id', bidId).eq('organisation_id', profile.organisation_id);
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Offre refusée' };
}
