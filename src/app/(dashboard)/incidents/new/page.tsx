import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { IncidentForm } from "@/components/forms/incident-form";

export default async function NewIncidentPage({ searchParams }: { searchParams: { logement_id?: string; mission_id?: string } }) {
  await requireProfile();
  const supabase = createClient();
  const { data: logements } = await supabase.from("logements").select("*").order("name");
  const { data: prestataires } = await supabase.from("prestataires").select("*").order("full_name");

  return (
    <div>
      <PageHeader
        title="Nouvel incident"
        showCreate={false}
        showBack={true}
        backHref="/incidents"
      />
      <IncidentForm logements={logements ?? []} prestataires={prestataires ?? []} defaultLogementId={searchParams.logement_id} defaultMissionId={searchParams.mission_id} />
    </div>
  );
}
