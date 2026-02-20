import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ReservationForm } from "@/components/forms/reservation-form";
import { redirect } from "next/navigation";

export default async function NewReservationPage() {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/reservations");

  const supabase = createClient();

  const { data: logements, error } = await supabase
    .from("logements")
    .select("*")
    .eq("status", "ACTIF")
    .order("name");

  if (error) {
    console.error("Error fetching logements:", error);
    throw new Error(`Failed to fetch logements: ${error.message}`);
  }

  return (
    <div>
      <PageHeader title="Nouvelle réservation" />
      <ReservationForm logements={logements ?? []} />
    </div>
  );
}
