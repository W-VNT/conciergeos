"use server";

import { createClient } from "@/lib/supabase/server";
import type { BookingPlatform } from "@/types/database";

// ─── Types ───────────────────────────────────────────────────────────

export interface RevenueAnalytics {
  revPAR: number;
  adr: number;
  avgStayDuration: number;
  activeLogements: number;
}

export interface OccupationByLogement {
  logementId: string;
  logementName: string;
  occupiedNights: number;
  availableNights: number;
  occupationRate: number;
  revenue: number;
}

export interface OccupationByMonth {
  month: string; // YYYY-MM
  monthLabel: string; // e.g. "Janvier 2026"
  occupiedNights: number;
  totalNights: number;
  occupationRate: number;
  revenue: number;
}

export interface RevenueByPlatform {
  platform: BookingPlatform;
  platformLabel: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

// ─── French month names ──────────────────────────────────────────────

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const PLATFORM_LABELS: Record<BookingPlatform, string> = {
  AIRBNB: "Airbnb",
  BOOKING: "Booking.com",
  DIRECT: "Direct",
  AUTRE: "Autre",
};

// ─── Revenue Analytics (R9) ──────────────────────────────────────────

/**
 * Compute RevPAR, ADR, average stay duration, and active logements count.
 */
export async function getRevenueAnalytics(
  startDate: Date,
  endDate: Date,
  organisationId: string,
): Promise<RevenueAnalytics> {
  const supabase = createClient();

  // Parallel queries
  const [{ data: logements }, { data: reservations }] = await Promise.all([
    supabase
      .from("logements")
      .select("id")
      .eq("organisation_id", organisationId)
      .eq("status", "ACTIF"),
    supabase
      .from("reservations")
      .select("check_in_date, check_out_date, amount")
      .eq("organisation_id", organisationId)
      .eq("status", "CONFIRMEE")
      .gte("check_out_date", startDate.toISOString())
      .lte("check_in_date", endDate.toISOString()),
  ]);

  const activeLogements = logements?.length ?? 0;
  const daysInRange = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  let totalRevenue = 0;
  let totalOccupiedNights = 0;
  let totalStayNights = 0;

  reservations?.forEach((r) => {
    const checkIn = new Date(r.check_in_date);
    const checkOut = new Date(r.check_out_date);
    const amount = Number(r.amount) || 0;

    // Full stay duration (for average stay calculation)
    const fullNights = Math.max(
      0,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
    );
    totalStayNights += fullNights;

    // Clamped to range for RevPAR / ADR
    const effectiveCheckIn = checkIn < startDate ? startDate : checkIn;
    const effectiveCheckOut = checkOut > endDate ? new Date(endDate.getTime() + 86400000) : checkOut;
    const nightsInRange = Math.max(
      0,
      Math.ceil(
        (effectiveCheckOut.getTime() - effectiveCheckIn.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    totalOccupiedNights += nightsInRange;
    totalRevenue += amount;
  });

  const reservationCount = reservations?.length ?? 0;

  // RevPAR = total revenue / (active logements x days in range)
  const revPAR =
    activeLogements > 0 ? totalRevenue / (activeLogements * daysInRange) : 0;

  // ADR = total revenue / total occupied nights
  const adr = totalOccupiedNights > 0 ? totalRevenue / totalOccupiedNights : 0;

  // Average stay duration
  const avgStayDuration =
    reservationCount > 0 ? totalStayNights / reservationCount : 0;

  return {
    revPAR: Math.round(revPAR * 100) / 100,
    adr: Math.round(adr * 100) / 100,
    avgStayDuration: Math.round(avgStayDuration * 10) / 10,
    activeLogements,
  };
}

// ─── Occupation by Logement (R10) ────────────────────────────────────

/**
 * Compute occupation metrics per active logement for the given date range.
 */
export async function getOccupationByLogement(
  startDate: Date,
  endDate: Date,
  organisationId: string,
): Promise<OccupationByLogement[]> {
  const supabase = createClient();

  const [{ data: logements }, { data: reservations }] = await Promise.all([
    supabase
      .from("logements")
      .select("id, name")
      .eq("organisation_id", organisationId)
      .eq("status", "ACTIF"),
    supabase
      .from("reservations")
      .select("logement_id, check_in_date, check_out_date, amount")
      .eq("organisation_id", organisationId)
      .eq("status", "CONFIRMEE")
      .gte("check_out_date", startDate.toISOString())
      .lte("check_in_date", endDate.toISOString()),
  ]);

  const daysInRange = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  // Build a map of logement -> { occupiedNights, revenue }
  const logementMap = new Map<
    string,
    { occupiedNights: number; revenue: number }
  >();

  reservations?.forEach((r) => {
    const checkIn = new Date(r.check_in_date);
    const checkOut = new Date(r.check_out_date);
    const effectiveCheckIn = checkIn < startDate ? startDate : checkIn;
    const effectiveCheckOut = checkOut > endDate ? new Date(endDate.getTime() + 86400000) : checkOut;
    const nights = Math.max(
      0,
      Math.ceil(
        (effectiveCheckOut.getTime() - effectiveCheckIn.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    const existing = logementMap.get(r.logement_id) ?? {
      occupiedNights: 0,
      revenue: 0,
    };
    existing.occupiedNights += nights;
    existing.revenue += Number(r.amount) || 0;
    logementMap.set(r.logement_id, existing);
  });

  const result: OccupationByLogement[] = (logements ?? []).map((l) => {
    const data = logementMap.get(l.id) ?? { occupiedNights: 0, revenue: 0 };
    return {
      logementId: l.id,
      logementName: l.name,
      occupiedNights: data.occupiedNights,
      availableNights: daysInRange,
      occupationRate:
        daysInRange > 0
          ? Math.round((data.occupiedNights / daysInRange) * 100)
          : 0,
      revenue: data.revenue,
    };
  });

  // Sort by occupation rate descending
  result.sort((a, b) => b.occupationRate - a.occupationRate);

  return result;
}

// ─── Occupation by Month (R10) ───────────────────────────────────────

/**
 * Compute occupation metrics per month in the given date range.
 */
export async function getOccupationByMonth(
  startDate: Date,
  endDate: Date,
  organisationId: string,
): Promise<OccupationByMonth[]> {
  const supabase = createClient();

  const [{ data: logements }, { data: reservations }] = await Promise.all([
    supabase
      .from("logements")
      .select("id")
      .eq("organisation_id", organisationId)
      .eq("status", "ACTIF"),
    supabase
      .from("reservations")
      .select("check_in_date, check_out_date, amount")
      .eq("organisation_id", organisationId)
      .eq("status", "CONFIRMEE")
      .gte("check_out_date", startDate.toISOString())
      .lte("check_in_date", endDate.toISOString()),
  ]);

  const activeLogements = logements?.length ?? 0;

  // Build month buckets from start to end
  const months: {
    key: string;
    label: string;
    start: Date;
    end: Date;
    daysInMonth: number;
  }[] = [];

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const rangeEnd = new Date(endDate);

  while (cursor <= rangeEnd) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Clamp to actual range
    const effectiveStart = monthStart < startDate ? startDate : monthStart;
    const effectiveEnd = monthEnd > endDate ? endDate : monthEnd;
    const daysInMonth = Math.max(
      1,
      Math.ceil(
        (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    months.push({
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: `${MONTH_NAMES_FR[month]} ${year}`,
      start: effectiveStart,
      end: effectiveEnd,
      daysInMonth,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  // For each month, compute occupied nights and revenue
  const result: OccupationByMonth[] = months.map((m) => {
    let occupiedNights = 0;
    let revenue = 0;

    reservations?.forEach((r) => {
      const checkIn = new Date(r.check_in_date);
      const checkOut = new Date(r.check_out_date);

      // Check overlap with this month
      const overlapStart = checkIn < m.start ? m.start : checkIn;
      const overlapEnd = checkOut > new Date(m.end.getTime() + 86400000)
        ? new Date(m.end.getTime() + 86400000)
        : checkOut;

      if (overlapStart < overlapEnd) {
        const nights = Math.ceil(
          (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24),
        );
        occupiedNights += Math.max(0, nights);

        // Proportional revenue based on nights in this month vs total nights
        const totalNights = Math.max(
          1,
          Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );
        const proportion = Math.max(0, nights) / totalNights;
        revenue += (Number(r.amount) || 0) * proportion;
      }
    });

    const totalNights = m.daysInMonth * activeLogements;
    return {
      month: m.key,
      monthLabel: m.label,
      occupiedNights,
      totalNights,
      occupationRate:
        totalNights > 0 ? Math.round((occupiedNights / totalNights) * 100) : 0,
      revenue: Math.round(revenue),
    };
  });

  return result;
}

// ─── Revenue by Platform (R10) ───────────────────────────────────────

/**
 * Group reservations by booking platform and compute revenue totals.
 */
export async function getRevenueByPlatform(
  startDate: Date,
  endDate: Date,
  organisationId: string,
): Promise<RevenueByPlatform[]> {
  const supabase = createClient();

  const { data: reservations } = await supabase
    .from("reservations")
    .select("platform, amount")
    .eq("organisation_id", organisationId)
    .eq("status", "CONFIRMEE")
    .gte("check_out_date", startDate.toISOString())
    .lte("check_in_date", endDate.toISOString());

  // Group by platform
  const platformMap = new Map<
    BookingPlatform,
    { count: number; totalAmount: number }
  >();

  let grandTotal = 0;

  reservations?.forEach((r) => {
    const platform = (r.platform as BookingPlatform) || "AUTRE";
    const amount = Number(r.amount) || 0;
    grandTotal += amount;

    const existing = platformMap.get(platform) ?? { count: 0, totalAmount: 0 };
    existing.count += 1;
    existing.totalAmount += amount;
    platformMap.set(platform, existing);
  });

  // Build result with all known platforms (even if 0)
  const allPlatforms: BookingPlatform[] = ["AIRBNB", "BOOKING", "DIRECT", "AUTRE"];
  const result: RevenueByPlatform[] = allPlatforms.map((platform) => {
    const data = platformMap.get(platform) ?? { count: 0, totalAmount: 0 };
    return {
      platform,
      platformLabel: PLATFORM_LABELS[platform],
      count: data.count,
      totalAmount: data.totalAmount,
      percentage:
        grandTotal > 0
          ? Math.round((data.totalAmount / grandTotal) * 100)
          : 0,
    };
  });

  // Sort by totalAmount descending
  result.sort((a, b) => b.totalAmount - a.totalAmount);

  return result;
}
