'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile, isAdminOrManager } from '@/lib/auth';

const BADGE_DEFINITIONS = [
  { code: 'FIRST_MISSION', label: 'Première mission', condition: (totalMissions: number) => totalMissions >= 1 },
  { code: 'MISSION_10', label: '10 missions', condition: (totalMissions: number) => totalMissions >= 10 },
  { code: 'MISSION_50', label: '50 missions', condition: (totalMissions: number) => totalMissions >= 50 },
  { code: 'MISSION_100', label: 'Centurion', condition: (totalMissions: number) => totalMissions >= 100 },
  { code: 'SPEED_DEMON', label: 'Rapide', condition: (_: number, avgMinutes: number) => avgMinutes > 0 && avgMinutes < 30 },
  { code: 'POINTS_500', label: '500 points', condition: (_: number, __: number, totalPoints: number) => totalPoints >= 500 },
  { code: 'POINTS_1000', label: '1000 points', condition: (_: number, __: number, totalPoints: number) => totalPoints >= 1000 },
];

const POINTS_CONFIG = {
  MISSION_COMPLETE: 10,
  MISSION_ON_TIME: 5,
  MISSION_FAST: 3,
  INCIDENT_RESOLVED: 15,
};

export async function awardPoints(operatorId: string, reason: string, points: number, entityType?: string, entityId?: string) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return { success: false, error: 'Non autorisé' };
  if (points < 0 || points > 1000) return { success: false, error: 'Points invalides' };
  const supabase = await createClient();
  const { error } = await supabase.from('operator_points').insert({
    organisation_id: profile.organisation_id,
    operator_id: operatorId,
    points,
    reason,
    entity_type: entityType || null,
    entity_id: entityId || null,
  });
  if (error) return { success: false, error: error.message };

  // Check and award badges
  await checkBadges(operatorId);
  return { success: true };
}

export async function awardMissionPoints(operatorId: string, missionId: string, wasOnTime: boolean, durationMinutes?: number) {
  let points = POINTS_CONFIG.MISSION_COMPLETE;
  let reason = 'Mission terminée';
  if (wasOnTime) {
    points += POINTS_CONFIG.MISSION_ON_TIME;
    reason += ' (dans les temps)';
  }
  if (durationMinutes && durationMinutes < 30) {
    points += POINTS_CONFIG.MISSION_FAST;
    reason += ' (rapide)';
  }
  return awardPoints(operatorId, reason, points, 'mission', missionId);
}

async function checkBadges(operatorId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Get stats
  const [pointsRes, missionsRes, existingBadgesRes] = await Promise.all([
    supabase.from('operator_points').select('points').eq('organisation_id', profile.organisation_id).eq('operator_id', operatorId),
    supabase.from('missions').select('id, started_at, completed_at').eq('organisation_id', profile.organisation_id).eq('assigned_to', operatorId).eq('status', 'TERMINE'),
    supabase.from('operator_badges').select('badge_code').eq('organisation_id', profile.organisation_id).eq('operator_id', operatorId),
  ]);

  const totalPoints = (pointsRes.data || []).reduce((s: number, p: any) => s + p.points, 0);
  const totalMissions = (missionsRes.data || []).length;
  const avgMinutes = totalMissions > 0
    ? (missionsRes.data || []).reduce((s: number, m: any) => {
        if (m.started_at && m.completed_at) {
          return s + (new Date(m.completed_at).getTime() - new Date(m.started_at).getTime()) / 60000;
        }
        return s;
      }, 0) / totalMissions
    : 0;

  const existingCodes = new Set((existingBadgesRes.data || []).map((b: any) => b.badge_code));

  for (const badge of BADGE_DEFINITIONS) {
    if (existingCodes.has(badge.code)) continue;
    if (badge.condition(totalMissions, avgMinutes, totalPoints)) {
      await supabase.from('operator_badges').insert({
        organisation_id: profile.organisation_id,
        operator_id: operatorId,
        badge_code: badge.code,
        badge_label: badge.label,
      });
    }
  }
}

export async function getLeaderboard() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: points } = await supabase
    .from('operator_points')
    .select('operator_id, points')
    .eq('organisation_id', profile.organisation_id);

  const { data: badges } = await supabase
    .from('operator_badges')
    .select('operator_id, badge_code, badge_label')
    .eq('organisation_id', profile.organisation_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('organisation_id', profile.organisation_id)
    .in('role', ['OPERATEUR', 'MANAGER', 'ADMIN']);

  // Aggregate
  const operatorMap = new Map<string, { id: string; name: string; avatar_url: string | null; totalPoints: number; badges: { code: string; label: string }[] }>();
  for (const p of profiles || []) {
    operatorMap.set(p.id, { id: p.id, name: p.full_name, avatar_url: p.avatar_url, totalPoints: 0, badges: [] });
  }
  for (const p of points || []) {
    const entry = operatorMap.get(p.operator_id);
    if (entry) entry.totalPoints += p.points;
  }
  for (const b of badges || []) {
    const entry = operatorMap.get(b.operator_id);
    if (entry) entry.badges.push({ code: b.badge_code, label: b.badge_label });
  }

  return Array.from(operatorMap.values())
    .filter((e) => e.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints);
}
