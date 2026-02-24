"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Mission, Reservation } from "@/types/database";

/**
 * Get calendar data for a specific month with a +/- 7 day buffer for items
 * that span month boundaries.
 *
 * For OPERATEUR role: only returns their assigned missions.
 */
export async function getCalendarData(
  month: number,
  year: number
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Calculate date range: start of month - 7 days to end of month + 7 days
  const startDate = new Date(year, month - 1, 1);
  startDate.setDate(startDate.getDate() - 7);
  const rangeStart = startDate.toISOString().split("T")[0];

  const endDate = new Date(year, month, 0); // Last day of month
  endDate.setDate(endDate.getDate() + 8); // +7 days + 1 for exclusive end
  const rangeEnd = endDate.toISOString().split("T")[0];

  // Fetch missions in range
  let missionsQuery = supabase
    .from("missions")
    .select(
      `
      *,
      logement:logements(name),
      assignee:profiles(full_name)
    `
    )
    .eq("organisation_id", profile.organisation_id)
    .gte("scheduled_at", `${rangeStart}T00:00:00`)
    .lte("scheduled_at", `${rangeEnd}T23:59:59`);

  // OPERATEUR role: only see their own assigned missions
  if (profile.role === "OPERATEUR") {
    missionsQuery = missionsQuery.eq("assigned_to", profile.id);
  }

  const { data: missions } = await missionsQuery.order("scheduled_at", {
    ascending: true,
  });

  // Fetch reservations that overlap with the range
  // A reservation overlaps if check_in_date < rangeEnd AND check_out_date > rangeStart
  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      `
      *,
      logement:logements(name)
    `
    )
    .eq("organisation_id", profile.organisation_id)
    .lt("check_in_date", rangeEnd)
    .gt("check_out_date", rangeStart)
    .order("check_in_date", { ascending: true });

  return {
    missions: (missions as Mission[]) || [],
    reservations: (reservations as Reservation[]) || [],
  };
}

/**
 * Get filter options (logements and operators) for the calendar.
 * These are not month-dependent so they can be cached more aggressively.
 */
export async function getCalendarFilters() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: logements }, { data: operators }] = await Promise.all([
    supabase
      .from("logements")
      .select("id, name")
      .eq("organisation_id", profile.organisation_id)
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organisation_id", profile.organisation_id)
      .eq("role", "OPERATEUR")
      .order("full_name"),
  ]);

  return {
    logements: logements || [],
    operators: operators || [],
  };
}
