import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Calendar from "@/components/calendrier/calendar";
import type { Mission, Reservation } from "@/types/database";

export default async function CalendrierPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Get all missions for the organisation
  const { data: missions } = await supabase
    .from("missions")
    .select(`
      *,
      logement:logements(name),
      assignee:profiles(full_name)
    `)
    .eq("organisation_id", profile.organisation_id)
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
      />
    </div>
  );
}
