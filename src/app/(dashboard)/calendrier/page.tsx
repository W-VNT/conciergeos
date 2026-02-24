import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Calendar from "@/components/calendrier/calendar";
import type { Mission, Reservation } from "@/types/database";

export const metadata = { title: "Calendrier" };
export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Get missions for the organisation, scoped by role
  let missionsQuery = supabase
    .from("missions")
    .select(`
      *,
      logement:logements(name),
      assignee:profiles(full_name)
    `)
    .eq("organisation_id", profile.organisation_id);

  // OPERATEUR role: only see their own assigned missions
  if (profile.role === "OPERATEUR") {
    missionsQuery = missionsQuery.eq("assigned_to", profile.id);
  }

  const { data: missions } = await missionsQuery
    .order("scheduled_at", { ascending: true });

  // Get all reservations for the organisation
  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      *,
      logement:logements(name)
    `)
    .eq("organisation_id", profile.organisation_id)
    .order("check_in_date", { ascending: true });

  // Fetch logements for filter dropdown
  const { data: logements } = await supabase
    .from("logements")
    .select("id, name")
    .eq("organisation_id", profile.organisation_id)
    .order("name");

  // Fetch operators for filter dropdown
  const { data: operators } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organisation_id", profile.organisation_id)
    .eq("role", "OPERATEUR")
    .order("full_name");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Calendrier</h1>
        <p className="text-muted-foreground mt-2">
          Vue mensuelle des missions et réservations
        </p>
      </div>

      <Calendar
        missions={(missions as Mission[]) || []}
        reservations={(reservations as Reservation[]) || []}
        logements={logements || []}
        operators={operators || []}
      />
    </div>
  );
}
