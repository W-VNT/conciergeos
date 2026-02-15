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

  if (!data) return null;

  // Add email from auth.users to profile
  return { ...data, email: user.email };
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
    // Auto-onboarding via SECURITY DEFINER function (bypasses RLS)
    const { data: newProfile, error } = await supabase.rpc('handle_onboarding', {
      p_user_id: user.id,
      p_full_name: user.email?.split('@')[0] || 'Admin',
    });

    if (error || !newProfile) redirect('/login');
    return { ...newProfile, email: user.email } as Profile;
  }

  // Add email from auth.users to profile
  return { ...profile, email: user.email };
}

export function isAdmin(profile: Profile): boolean {
  return profile.role === 'ADMIN';
}
