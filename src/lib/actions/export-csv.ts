"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

/** Strip CSV formula injection prefixes (=, +, -, @, \t, \r) */
function sanitizeCell(value: string): string {
  let s = value.replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return s;
}

export async function exportMissionsCSV(filters?: { status?: string; type?: string }) {
  const profile = await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("missions")
    .select("*, logement:logements(name), assignee:profiles(full_name)")
    .eq("organisation_id", profile.organisation_id)
    .order("scheduled_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.type) query = query.eq("type", filters.type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const headers = ["ID", "Type", "Statut", "Priorité", "Logement", "Assigné à", "Planifié le", "Terminé le", "Notes"];
  const rows = (data ?? []).map((m: Record<string, unknown>) => [
    m.id as string,
    m.type as string,
    m.status as string,
    m.priority as string,
    sanitizeCell((m.logement as Record<string, string> | null)?.name ?? ""),
    sanitizeCell((m.assignee as Record<string, string> | null)?.full_name ?? ""),
    m.scheduled_at as string,
    (m.completed_at as string) ?? "",
    sanitizeCell((m.notes as string) ?? ""),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  return csv;
}

export async function exportIncidentsCSV(filters?: { status?: string; severity?: string }) {
  const profile = await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("incidents")
    .select("*, logement:logements(name), prestataire:prestataires(full_name)")
    .eq("organisation_id", profile.organisation_id)
    .order("opened_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.severity) query = query.eq("severity", filters.severity);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const headers = ["ID", "Sévérité", "Statut", "Logement", "Prestataire", "Description", "Coût", "Ouvert le", "Résolu le"];
  const rows = (data ?? []).map((i: Record<string, unknown>) => [
    i.id as string,
    i.severity as string,
    i.status as string,
    sanitizeCell((i.logement as Record<string, string> | null)?.name ?? ""),
    sanitizeCell((i.prestataire as Record<string, string> | null)?.full_name ?? ""),
    sanitizeCell((i.description as string) ?? ""),
    String(i.cost ?? ""),
    i.opened_at as string,
    (i.resolved_at as string) ?? "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  return csv;
}

export async function exportReservationsCSV(filters?: { status?: string; platform?: string }) {
  const profile = await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("reservations")
    .select("*, logement:logements(name)")
    .eq("organisation_id", profile.organisation_id)
    .order("check_in_date", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.platform) query = query.eq("platform", filters.platform);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const headers = ["ID", "Voyageur", "Logement", "Plateforme", "Arrivée", "Départ", "Montant", "Statut", "Paiement"];
  const rows = (data ?? []).map((r: Record<string, unknown>) => [
    r.id as string,
    sanitizeCell((r.guest_name as string) ?? ""),
    sanitizeCell((r.logement as Record<string, string> | null)?.name ?? ""),
    r.platform as string,
    r.check_in_date as string,
    r.check_out_date as string,
    String(r.amount ?? ""),
    r.status as string,
    (r.payment_status as string) ?? "",
  ]);

  return [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
}

export async function exportContratsCSV(filters?: { status?: string; type?: string }) {
  const profile = await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("contrats")
    .select("*, proprietaire:proprietaires(full_name), logement:logements(name)")
    .eq("organisation_id", profile.organisation_id)
    .order("start_date", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.type) query = query.eq("type", filters.type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const headers = ["ID", "Propriétaire", "Logement", "Type", "Début", "Fin", "Commission %", "Statut"];
  const rows = (data ?? []).map((c: Record<string, unknown>) => [
    c.id as string,
    sanitizeCell((c.proprietaire as Record<string, string> | null)?.full_name ?? ""),
    sanitizeCell((c.logement as Record<string, string> | null)?.name ?? ""),
    c.type as string,
    c.start_date as string,
    c.end_date as string,
    String(c.commission_rate ?? ""),
    c.status as string,
  ]);

  return [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
}

export async function exportFinancesCSV() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("revenus")
    .select("*, logement:logements(name), reservation:reservations(guest_name, platform)")
    .eq("organisation_id", profile.organisation_id)
    .order("date_checkin", { ascending: false });

  if (error) throw new Error(error.message);

  const headers = ["ID", "Logement", "Voyageur", "Plateforme", "Check-in", "Check-out", "Brut", "Commission", "Net"];
  const rows = (data ?? []).map((r: Record<string, unknown>) => [
    r.id as string,
    sanitizeCell((r.logement as Record<string, string> | null)?.name ?? ""),
    sanitizeCell((r.reservation as Record<string, string> | null)?.guest_name ?? ""),
    (r.reservation as Record<string, string> | null)?.platform ?? "",
    r.date_checkin as string,
    r.date_checkout as string,
    String(r.montant_brut ?? ""),
    String(r.montant_commission ?? ""),
    String(r.montant_net ?? ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
}

export async function exportPrestatairesCSV() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("prestataires")
    .select("*")
    .eq("organisation_id", profile.organisation_id)
    .order("full_name");

  if (error) throw new Error(error.message);

  const headers = ["ID", "Nom", "Spécialité", "Statut juridique", "Téléphone", "Email", "Ville", "Taux horaire", "Score"];
  const rows = (data ?? []).map((p: Record<string, unknown>) => [
    p.id as string,
    sanitizeCell((p.full_name as string) ?? ""),
    p.specialty as string,
    p.statut_juridique as string,
    (p.phone as string) ?? "",
    (p.email as string) ?? "",
    sanitizeCell((p.city as string) ?? ""),
    String(p.hourly_rate ?? ""),
    String(p.reliability_score ?? ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
}

export async function exportProprietairesCSV() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("proprietaires")
    .select("*")
    .eq("organisation_id", profile.organisation_id)
    .order("full_name");

  if (error) throw new Error(error.message);

  const headers = ["ID", "Nom", "Statut juridique", "Téléphone", "Email", "Ville", "SIRET"];
  const rows = (data ?? []).map((p: Record<string, unknown>) => [
    p.id as string,
    sanitizeCell((p.full_name as string) ?? ""),
    p.statut_juridique as string,
    (p.phone as string) ?? "",
    (p.email as string) ?? "",
    sanitizeCell((p.city as string) ?? ""),
    (p.siret as string) ?? "",
  ]);

  return [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
}
