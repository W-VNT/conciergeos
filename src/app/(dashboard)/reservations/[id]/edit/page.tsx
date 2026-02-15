import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ReservationForm } from "@/components/forms/reservation-form";

export default async function EditReservationPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect(`/reservations/${params.id}`);

  const supabase = createClient();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!reservation) notFound();

  const { data: logements } = await supabase
    .from("logements")
    .select("*")
    .order("name");

  return (
    <div>
      <PageHeader title="Modifier la réservation" />
      <ReservationForm reservation={reservation} logements={logements ?? []} />
    </div>
  );
}
