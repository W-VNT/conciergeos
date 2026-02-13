"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function exportMissionsCSV(filters?: { status?: string; type?: string }) {
  await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("missions")
    .select("*, logement:logements(name), assignee:profiles(full_name)")
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
    (m.logement as Record<string, string> | null)?.name ?? "",
    (m.assignee as Record<string, string> | null)?.full_name ?? "",
    m.scheduled_at as string,
    (m.completed_at as string) ?? "",
    ((m.notes as string) ?? "").replace(/"/g, '""'),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  return csv;
}

export async function exportIncidentsCSV(filters?: { status?: string; severity?: string }) {
  await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("incidents")
    .select("*, logement:logements(name), prestataire:prestataires(full_name)")
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
    (i.logement as Record<string, string> | null)?.name ?? "",
    (i.prestataire as Record<string, string> | null)?.full_name ?? "",
    ((i.description as string) ?? "").replace(/"/g, '""'),
    String(i.cost ?? ""),
    i.opened_at as string,
    (i.resolved_at as string) ?? "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  return csv;
}
