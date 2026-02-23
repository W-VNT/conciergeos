import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { IncidentForm } from "@/components/forms/incident-form";
import { PhotoSection } from "@/components/shared/photo-section";
import { randomUUID } from "crypto";

export default async function NewIncidentPage({ searchParams }: { searchParams: { logement_id?: string; mission_id?: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();
  const [{ data: logements }, { data: prestataires }] = await Promise.all([
    supabase.from("logements").select("*").eq("organisation_id", profile.organisation_id).order("name"),
    supabase.from("prestataires").select("*").eq("organisation_id", profile.organisation_id).order("full_name"),
  ]);

  const preGeneratedId = randomUUID();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvel incident"
        showCreate={false}
        showBack={true}
        backHref="/incidents"
      />
      <IncidentForm
        logements={logements ?? []}
        prestataires={prestataires ?? []}
        defaultLogementId={searchParams.logement_id}
        defaultMissionId={searchParams.mission_id}
        preGeneratedId={preGeneratedId}
      />
      <PhotoSection
        organisationId={profile.organisation_id}
        entityType="INCIDENT"
        entityId={preGeneratedId}
        initialAttachments={[]}
        canUpload={true}
        canDelete={true}
      />
    </div>
  );
}
