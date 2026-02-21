import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { MissionTimelineCard } from "@/components/ma-journee/mission-timeline-card";
import { MISSION_TYPE_LABELS } from "@/types/database";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

export const revalidate = 30;

export default async function MaJourneePage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let query = supabase
    .from("missions")
    .select(`
      *,
      logement:logements(id, name, address_line1, city, postal_code, latitude, longitude, lockbox_code, wifi_name, wifi_password),
      assignee:profiles(full_name),
      reservation:reservations(guest_name, guest_count, check_in_time, check_out_time)
    `)
    .gte("scheduled_at", today.toISOString())
    .lt("scheduled_at", tomorrow.toISOString())
    .in("status", ["A_FAIRE", "EN_COURS", "TERMINE"])
    .order("scheduled_at", { ascending: true });

  if (!isAdmin(profile)) {
    query = query.eq("assigned_to", profile.id);
  }

  const { data: missions } = await query;
  const allMissions = missions ?? [];
  const doneCount = allMissions.filter((m) => m.status === "TERMINE").length;
  const total = allMissions.length;
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Ma journée</h1>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
      </div>

      {total > 0 ? (
        <>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {total} mission{total > 1 ? "s" : ""} · {doneCount} terminée{doneCount > 1 ? "s" : ""}
              </span>
              <span className="font-medium tabular-nums">{progressPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            {allMissions.map((mission) => (
              <div key={mission.id} className="flex gap-3">
                {/* Time column */}
                <div className="flex flex-col items-center pt-3 w-12 flex-shrink-0">
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {new Date(mission.scheduled_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="flex-1 w-px bg-border mt-2" />
                </div>

                {/* Card */}
                <div className="flex-1 min-w-0">
                  <MissionTimelineCard mission={mission} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">Aucune mission aujourd&apos;hui</p>
          <p className="text-sm text-muted-foreground mt-1">
            Profitez de votre journée ou{" "}
            <Link href="/missions" className="text-primary hover:underline">
              consultez toutes les missions
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
