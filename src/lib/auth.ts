import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Profile } from '@/types/database';

export async function getSession() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) redirect('/login');
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function requireProfile(): Promise<Profile> {
  const user = await requireAuth();
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Auto-onboarding: create org + admin profile
    const { data: org } = await supabase
      .from('organisations')
      .insert({ name: 'Ma Conciergerie' })
      .select()
      .single();

    if (!org) redirect('/login');

    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        organisation_id: org.id,
        full_name: user.email?.split('@')[0] || 'Admin',
        role: 'ADMIN',
      })
      .select()
      .single();

    if (!newProfile) redirect('/login');
    return newProfile;
  }

  return profile;
}

export function isAdmin(profile: Profile): boolean {
  return profile.role === 'ADMIN';
}
