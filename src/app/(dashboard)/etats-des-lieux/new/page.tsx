import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { EdlNewForm } from "@/components/etats-des-lieux/edl-new-form";
import { redirect } from "next/navigation";

export default async function NewEtatDesLieuxPage() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/etats-des-lieux");

  const supabase = createClient();

  const [{ data: logements }, { data: reservations }] = await Promise.all([
    supabase
      .from("logements")
      .select("id, name")
      .eq("organisation_id", profile.organisation_id)
      .eq("status", "ACTIF")
      .order("name"),
    supabase
      .from("reservations")
      .select("id, guest_name, logement_id")
      .eq("organisation_id", profile.organisation_id)
      .in("status", ["CONFIRMEE", "EN_ATTENTE"])
      .order("check_in_date", { ascending: false })
      .limit(100),
  ]);

  return (
    <div>
      <PageHeader
        title="Nouvel état des lieux"
        showCreate={false}
        showBack={true}
        backHref="/etats-des-lieux"
      />
      <div className="max-w-2xl">
        <EdlNewForm
          logements={logements ?? []}
          reservations={reservations ?? []}
        />
      </div>
    </div>
  );
}
