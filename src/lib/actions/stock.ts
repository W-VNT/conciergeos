'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile, isAdminOrManager } from '@/lib/auth';
import type { StockMovement } from '@/types/database';

export async function getStockMovements(equipementId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*, equipement:equipements(*), mission:missions(*)')
    .eq('organisation_id', profile.organisation_id)
    .eq('equipement_id', equipementId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data as StockMovement[] };
}

export async function createStockMovement(data: {
  equipement_id: string;
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
  quantite: number;
  mission_id?: string;
  notes?: string;
}) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  // Validate quantity
  if (!Number.isInteger(data.quantite) || data.quantite <= 0) {
    return { success: false, error: 'La quantité doit être un entier positif' };
  }
  const supabase = await createClient();

  const { error } = await supabase.from('stock_movements').insert({
    organisation_id: profile.organisation_id,
    equipement_id: data.equipement_id,
    type: data.type,
    quantite: data.quantite,
    mission_id: data.mission_id || null,
    notes: data.notes || '',
    created_by: profile.id,
  });
  if (error) return { success: false, error: error.message };

  // Update equipement quantity
  const { data: equip } = await supabase
    .from('equipements')
    .select('quantite')
    .eq('id', data.equipement_id)
    .single();
  if (equip) {
    let newQty = equip.quantite;
    if (data.type === 'ENTREE') newQty += data.quantite;
    else if (data.type === 'SORTIE') newQty = Math.max(0, newQty - data.quantite);
    else newQty = data.quantite; // AJUSTEMENT = set absolute
    await supabase.from('equipements').update({ quantite: newQty }).eq('id', data.equipement_id);
  }

  return { success: true, message: 'Mouvement enregistré' };
}

export async function getLowStockAlerts() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('equipements')
    .select('*, logement:logements(id, name)')
    .eq('organisation_id', profile.organisation_id)
    .eq('categorie', 'CONSOMMABLE')
    .not('seuil_alerte', 'is', null)
    .order('nom');
  if (error) return [];
  return (data || []).filter((e: any) => e.seuil_alerte && e.quantite <= e.seuil_alerte);
}
