"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  type ActionResponse,
  successResponse,
  errorResponse,
} from "@/lib/action-response";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireOwnerProfile() {
  const profile = await requireProfile();
  if (profile.role !== "PROPRIETAIRE") {
    throw new Error("Accès réservé aux propriétaires");
  }
  if (!profile.proprietaire_id) {
    throw new Error("Aucun profil propriétaire associé");
  }
  return profile;
}

// ---------------------------------------------------------------------------
// getOwnerProfile
// ---------------------------------------------------------------------------

export async function getOwnerProfile() {
  const profile = await requireOwnerProfile();
  const supabase = createClient();

  const { data: proprietaire, error } = await supabase
    .from("proprietaires")
    .select("*")
    .eq("id", profile.proprietaire_id!)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (error || !proprietaire) {
    throw new Error("Profil propriétaire introuvable");
  }

  return proprietaire;
}

// ---------------------------------------------------------------------------
// updateOwnerProfile
// ---------------------------------------------------------------------------

export async function updateOwnerProfile(data: {
  full_name: string;
  phone: string;
  email: string;
  address_line1: string;
  postal_code: string;
  city: string;
}): Promise<ActionResponse> {
  try {
    const profile = await requireOwnerProfile();
    const supabase = createClient();

    const { error } = await supabase
      .from("proprietaires")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        email: data.email || null,
        address_line1: data.address_line1 || null,
        postal_code: data.postal_code || null,
        city: data.city || null,
      })
      .eq("id", profile.proprietaire_id!)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/owner/profile");
    revalidatePath("/owner/dashboard");
    return successResponse("Profil mis à jour avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour du profil"
    );
  }
}

// ---------------------------------------------------------------------------
// getOwnerContrats
// ---------------------------------------------------------------------------

export async function getOwnerContrats() {
  const profile = await requireOwnerProfile();
  const supabase = createClient();

  const { data: contrats, error } = await supabase
    .from("contrats")
    .select(
      "*, logement:logements(id, name, city)"
    )
    .eq("organisation_id", profile.organisation_id)
    .eq("proprietaire_id", profile.proprietaire_id!)
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);

  return contrats ?? [];
}

// ---------------------------------------------------------------------------
// getOwnerIncidents
// ---------------------------------------------------------------------------

export async function getOwnerIncidents() {
  const profile = await requireOwnerProfile();
  const supabase = createClient();

  // Get proprietaire's logement IDs
  const { data: logements } = await supabase
    .from("logements")
    .select("id")
    .eq("organisation_id", profile.organisation_id)
    .eq("owner_id", profile.proprietaire_id!);

  const logementIds = (logements ?? []).map((l) => l.id);

  if (logementIds.length === 0) return [];

  const { data: incidents, error } = await supabase
    .from("incidents")
    .select(
      "*, logement:logements(id, name)"
    )
    .eq("organisation_id", profile.organisation_id)
    .in("logement_id", logementIds)
    .order("opened_at", { ascending: false });

  if (error) throw new Error(error.message);

  return incidents ?? [];
}

// ---------------------------------------------------------------------------
// getOwnerMessages
// ---------------------------------------------------------------------------

export async function getOwnerMessages() {
  const profile = await requireOwnerProfile();
  const supabase = createClient();

  const { data: messages, error } = await supabase
    .from("owner_messages")
    .select("*, sender:profiles(id, full_name)")
    .eq("organisation_id", profile.organisation_id)
    .eq("proprietaire_id", profile.proprietaire_id!)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return messages ?? [];
}

// ---------------------------------------------------------------------------
// sendOwnerMessage
// ---------------------------------------------------------------------------

export async function sendOwnerMessage(
  content: string
): Promise<ActionResponse> {
  try {
    const profile = await requireOwnerProfile();
    const supabase = createClient();

    const { error } = await supabase.from("owner_messages").insert({
      organisation_id: profile.organisation_id,
      proprietaire_id: profile.proprietaire_id!,
      sender_type: "OWNER",
      sender_id: profile.id,
      content: content.trim(),
    });

    if (error) return errorResponse(error.message);

    revalidatePath("/owner/messages");
    return successResponse("Message envoyé");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de l'envoi du message"
    );
  }
}

// ---------------------------------------------------------------------------
// markOwnerMessagesRead
// ---------------------------------------------------------------------------

export async function markOwnerMessagesRead(): Promise<ActionResponse> {
  try {
    const profile = await requireOwnerProfile();
    const supabase = createClient();

    const { error } = await supabase
      .from("owner_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("organisation_id", profile.organisation_id)
      .eq("proprietaire_id", profile.proprietaire_id!)
      .eq("sender_type", "ADMIN")
      .is("read_at", null);

    if (error) return errorResponse(error.message);

    revalidatePath("/owner/messages");
    return successResponse("Messages marqués comme lus");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors du marquage des messages"
    );
  }
}

// ---------------------------------------------------------------------------
// getOwnerFinances
// ---------------------------------------------------------------------------

export interface OwnerFinanceData {
  totalCA: number;
  totalCommissions: number;
  netRevenue: number;
  nbReservations: number;
  monthlyData: {
    month: string;
    ca: number;
    commissions: number;
    net: number;
  }[];
  byLogement: {
    logement_id: string;
    logement_name: string;
    nb_reservations: number;
    total_brut: number;
    total_commissions: number;
    total_net: number;
  }[];
}

export async function getOwnerFinances(): Promise<OwnerFinanceData> {
  const profile = await requireOwnerProfile();
  const supabase = createClient();

  // Get proprietaire's logement IDs
  const { data: logements } = await supabase
    .from("logements")
    .select("id, name")
    .eq("organisation_id", profile.organisation_id)
    .eq("owner_id", profile.proprietaire_id!);

  const logementIds = (logements ?? []).map((l) => l.id);
  const logementNames = new Map(
    (logements ?? []).map((l) => [l.id, l.name])
  );

  if (logementIds.length === 0) {
    return {
      totalCA: 0,
      totalCommissions: 0,
      netRevenue: 0,
      nbReservations: 0,
      monthlyData: [],
      byLogement: [],
    };
  }

  // Fetch all revenus for owner's logements
  const { data: revenus, error } = await supabase
    .from("revenus")
    .select(
      "logement_id, montant_brut, montant_commission, montant_net, date_checkin"
    )
    .eq("organisation_id", profile.organisation_id)
    .in("logement_id", logementIds)
    .order("date_checkin", { ascending: true });

  if (error) throw new Error(error.message);

  const allRevenus = revenus ?? [];

  // Totals
  let totalCA = 0;
  let totalCommissions = 0;
  let netRevenue = 0;

  // Group by month
  const monthlyMap = new Map<
    string,
    { ca: number; commissions: number; net: number }
  >();

  // Group by logement
  const logementMap = new Map<
    string,
    {
      nb_reservations: number;
      total_brut: number;
      total_commissions: number;
      total_net: number;
    }
  >();

  for (const r of allRevenus) {
    const brut = Number(r.montant_brut || 0);
    const commission = Number(r.montant_commission || 0);
    const net = Number(r.montant_net || 0);

    totalCA += brut;
    totalCommissions += commission;
    netRevenue += net;

    // Monthly
    const monthKey = r.date_checkin
      ? r.date_checkin.substring(0, 7) // "YYYY-MM"
      : "unknown";
    const existing = monthlyMap.get(monthKey) || {
      ca: 0,
      commissions: 0,
      net: 0,
    };
    existing.ca += brut;
    existing.commissions += commission;
    existing.net += net;
    monthlyMap.set(monthKey, existing);

    // By logement
    const logEntry = logementMap.get(r.logement_id) || {
      nb_reservations: 0,
      total_brut: 0,
      total_commissions: 0,
      total_net: 0,
    };
    logEntry.nb_reservations += 1;
    logEntry.total_brut += brut;
    logEntry.total_commissions += commission;
    logEntry.total_net += net;
    logementMap.set(r.logement_id, logEntry);
  }

  // Convert monthly map to sorted array
  const monthlyData = Array.from(monthlyMap.entries())
    .filter(([key]) => key !== "unknown")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      ca: data.ca,
      commissions: data.commissions,
      net: data.net,
    }));

  // Convert logement map to array
  const byLogement = Array.from(logementMap.entries())
    .map(([logement_id, data]) => ({
      logement_id,
      logement_name: logementNames.get(logement_id) ?? "Logement inconnu",
      ...data,
    }))
    .sort((a, b) => b.total_brut - a.total_brut);

  return {
    totalCA,
    totalCommissions,
    netRevenue,
    nbReservations: allRevenus.length,
    monthlyData,
    byLogement,
  };
}

// ---------------------------------------------------------------------------
// Admin-side: sendAdminOwnerMessage
// ---------------------------------------------------------------------------

export async function sendAdminOwnerMessage(
  proprietaireId: string,
  content: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (profile.role !== "ADMIN" && profile.role !== "MANAGER") {
      return errorResponse("Non autorise");
    }

    const supabase = createClient();

    const { error } = await supabase.from("owner_messages").insert({
      organisation_id: profile.organisation_id,
      proprietaire_id: proprietaireId,
      sender_type: "ADMIN",
      sender_id: profile.id,
      content: content.trim(),
    });

    if (error) return errorResponse(error.message);

    revalidatePath(`/proprietaires/${proprietaireId}`);
    return successResponse("Message envoyé");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de l'envoi du message"
    );
  }
}

// ---------------------------------------------------------------------------
// Admin-side: getAdminOwnerMessages
// ---------------------------------------------------------------------------

export async function getAdminOwnerMessages(proprietaireId: string) {
  const profile = await requireProfile();
  if (profile.role !== "ADMIN" && profile.role !== "MANAGER") {
    throw new Error("Non autorise");
  }

  const supabase = createClient();

  const { data: messages, error } = await supabase
    .from("owner_messages")
    .select("*, sender:profiles(id, full_name)")
    .eq("organisation_id", profile.organisation_id)
    .eq("proprietaire_id", proprietaireId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return messages ?? [];
}
