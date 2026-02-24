import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyIcalToken } from "@/lib/actions/ical";
import type { Mission, Reservation } from "@/types/database";

/**
 * Public GET endpoint that generates an iCal (.ics) file for an organisation.
 *
 * Accepts a `token` query parameter for authentication.
 * The token is an HMAC-SHA256 of the organisationId.
 *
 * Contains:
 * - Missions as VEVENT (summary: type + logement name, dtstart: scheduled_at)
 * - Reservations as VEVENT (summary: guest_name + logement name, dtstart/dtend: check_in/check_out)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { organisationId: string } }
) {
  const { organisationId } = params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // Validate token
  if (!token || !(await verifyIcalToken(organisationId, token))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch missions with logement names
  const { data: missions } = await supabase
    .from("missions")
    .select("id, type, status, scheduled_at, notes, logement:logements(name)")
    .eq("organisation_id", organisationId)
    .in("status", ["A_FAIRE", "EN_COURS"])
    .order("scheduled_at", { ascending: true });

  // Fetch reservations with logement names
  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      "id, guest_name, check_in_date, check_out_date, notes, status, logement:logements(name)"
    )
    .eq("organisation_id", organisationId)
    .in("status", ["EN_ATTENTE", "CONFIRMEE"])
    .order("check_in_date", { ascending: true });

  // Generate iCal content
  const icsContent = generateIcs(
    organisationId,
    (missions || []) as any[],
    (reservations || []) as any[]
  );

  return new Response(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="conciergeos-${organisationId}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

// ---- iCal generation helpers ----

const MISSION_TYPE_LABELS_MAP: Record<string, string> = {
  CHECKIN: "Check-in",
  CHECKOUT: "Check-out",
  MENAGE: "Menage",
  INTERVENTION: "Intervention",
  URGENCE: "Urgence",
};

function escapeIcal(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcalDate(dateStr: string): string {
  // Convert ISO date string to iCal date format: YYYYMMDD
  const d = new Date(dateStr);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function formatIcalDateTime(dateStr: string): string {
  // Convert ISO date string to iCal datetime format: YYYYMMDDTHHMMSSZ
  const d = new Date(dateStr);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function generateIcs(
  organisationId: string,
  missions: any[],
  reservations: any[]
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ConciergeOS//Calendar//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:ConciergeOS`,
    "X-WR-TIMEZONE:Europe/Paris",
  ];

  // Add missions as events
  for (const mission of missions) {
    const logement = Array.isArray(mission.logement)
      ? mission.logement[0]
      : mission.logement;
    const logementName = logement?.name || "Logement inconnu";
    const typeLabel =
      MISSION_TYPE_LABELS_MAP[mission.type] || mission.type;
    const summary = `${typeLabel} - ${logementName}`;
    const description = mission.notes ? escapeIcal(mission.notes) : "";

    // Mission is a point-in-time event (1 hour default duration)
    const dtStart = formatIcalDateTime(mission.scheduled_at);
    const endTime = new Date(
      new Date(mission.scheduled_at).getTime() + 60 * 60 * 1000
    ).toISOString();
    const dtEnd = formatIcalDateTime(endTime);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:mission-${mission.id}@conciergeos`);
    lines.push(`DTSTAMP:${formatIcalDateTime(new Date().toISOString())}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcal(summary)}`);
    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }
    lines.push(`CATEGORIES:Mission,${typeLabel}`);
    lines.push(`STATUS:${mission.status === "EN_COURS" ? "TENTATIVE" : "CONFIRMED"}`);
    lines.push("END:VEVENT");
  }

  // Add reservations as all-day events
  for (const reservation of reservations) {
    const logement = Array.isArray(reservation.logement)
      ? reservation.logement[0]
      : reservation.logement;
    const logementName = logement?.name || "Logement inconnu";
    const summary = `${reservation.guest_name} - ${logementName}`;
    const description = reservation.notes
      ? escapeIcal(reservation.notes)
      : "";

    // Reservations are all-day events from check-in to check-out
    const dtStart = formatIcalDate(reservation.check_in_date);
    const dtEnd = formatIcalDate(reservation.check_out_date);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:reservation-${reservation.id}@conciergeos`);
    lines.push(`DTSTAMP:${formatIcalDateTime(new Date().toISOString())}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcal(summary)}`);
    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }
    lines.push("CATEGORIES:Reservation");
    lines.push("TRANSP:TRANSPARENT");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}
