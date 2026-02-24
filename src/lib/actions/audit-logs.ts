"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import type { AuditLog } from "@/types/database";

export interface AuditLogFilters {
  entity_type?: string;
  action?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface AuditLogPage {
  data: AuditLog[];
  total: number;
  page: number;
  per_page: number;
}

/**
 * Fetch paginated audit logs with optional filters.
 * Admin-only access.
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<AuditLogPage> {
  const profile = await requireProfile();

  if (!isAdmin(profile)) {
    return { data: [], total: 0, page: 1, per_page: 25 };
  }

  const supabase = createClient();
  const page = filters.page ?? 1;
  const per_page = filters.per_page ?? 25;
  const offset = (page - 1) * per_page;

  let query = supabase
    .from("audit_logs")
    .select("*, user:profiles!user_id(id, full_name, avatar_url)", {
      count: "exact",
    })
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + per_page - 1);

  if (filters.entity_type) {
    query = query.eq("entity_type", filters.entity_type);
  }
  if (filters.action) {
    query = query.eq("action", filters.action);
  }
  if (filters.user_id) {
    query = query.eq("user_id", filters.user_id);
  }
  if (filters.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters.date_to) {
    // Add end-of-day to include the full day
    query = query.lte("created_at", `${filters.date_to}T23:59:59.999Z`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("getAuditLogs error:", error);
    return { data: [], total: 0, page, per_page };
  }

  return {
    data: (data ?? []) as AuditLog[],
    total: count ?? 0,
    page,
    per_page,
  };
}

/**
 * Insert a new audit log entry.
 * Automatically scoped to the current user's organisation.
 */
export async function createAuditLog(params: {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  changes?: Record<string, unknown>;
}): Promise<void> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { error } = await supabase.from("audit_logs").insert({
      organisation_id: profile.organisation_id,
      user_id: profile.id,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id ?? null,
      changes: params.changes ?? {},
    });

    if (error) {
      console.error("createAuditLog error:", error);
    }
  } catch (err) {
    // Don't throw — audit logging should never break the main action
    console.error("createAuditLog unexpected error:", err);
  }
}

/**
 * Fetch distinct entity types from audit logs (for filter dropdown).
 * Admin-only.
 */
export async function getAuditEntityTypes(): Promise<string[]> {
  const profile = await requireProfile();
  if (!isAdmin(profile)) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("entity_type")
    .eq("organisation_id", profile.organisation_id)
    .order("entity_type");

  if (error) {
    console.error("getAuditEntityTypes error:", error);
    return [];
  }

  const unique = Array.from(new Set((data ?? []).map((r) => r.entity_type)));
  return unique;
}

/**
 * Fetch distinct actions from audit logs (for filter dropdown).
 * Admin-only.
 */
export async function getAuditActions(): Promise<string[]> {
  const profile = await requireProfile();
  if (!isAdmin(profile)) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("action")
    .eq("organisation_id", profile.organisation_id)
    .order("action");

  if (error) {
    console.error("getAuditActions error:", error);
    return [];
  }

  const unique = Array.from(new Set((data ?? []).map((r) => r.action)));
  return unique;
}
