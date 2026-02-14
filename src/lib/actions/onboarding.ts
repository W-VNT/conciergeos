'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateOrganisation(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();

  const name = formData.get('name') as string;
  const city = formData.get('city') as string;

  if (!name || name.trim().length < 2) {
    return { error: 'Le nom de la conciergerie est requis (min 2 caractères)' };
  }

  const { error } = await supabase
    .from('organisations')
    .update({
      name: name.trim(),
      city: city?.trim() || null,
    })
    .eq('id', profile.organisation_id);

  if (error) {
    console.error('Error updating organisation:', error);
    return { error: 'Erreur lors de la mise à jour de l\'organisation' };
  }

  revalidatePath('/');
  return { success: true };
}

export async function createFirstLogement(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();

  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const postalCode = formData.get('postal_code') as string;
  const lockboxCode = formData.get('lockbox_code') as string;
  const wifiName = formData.get('wifi_name') as string;
  const wifiPassword = formData.get('wifi_password') as string;

  if (!name || name.trim().length < 2) {
    return { error: 'Le nom du logement est requis' };
  }

  const { error } = await supabase.from('logements').insert({
    organisation_id: profile.organisation_id,
    name: name.trim(),
    address_line1: address?.trim() || null,
    city: city?.trim() || null,
    postal_code: postalCode?.trim() || null,
    lockbox_code: lockboxCode?.trim() || null,
    wifi_name: wifiName?.trim() || null,
    wifi_password: wifiPassword?.trim() || null,
    offer_tier: 'ESSENTIEL',
    status: 'ACTIF',
  });

  if (error) {
    console.error('Error creating logement:', error);
    return { error: 'Erreur lors de la création du logement' };
  }

  revalidatePath('/logements');
  return { success: true };
}

export async function completeOnboarding() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from('organisations')
    .update({ onboarding_completed: true })
    .eq('id', profile.organisation_id);

  if (error) {
    console.error('Error completing onboarding:', error);
    return { error: 'Erreur lors de la finalisation de l\'onboarding' };
  }

  revalidatePath('/');
  return { success: true };
}
