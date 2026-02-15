import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ReservationForm } from "@/components/forms/reservation-form";
import { redirect } from "next/navigation";

export default async function NewReservationPage() {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/reservations");

  const supabase = createClient();

  const { data: logements } = await supabase
    .from("logements")
    .select("*")
    .eq("status", "ACTIF")
    .order("name");

  return (
    <div>
      <PageHeader title="Nouvelle réservation" />
      <ReservationForm logements={logements ?? []} />
    </div>
  );
}
