import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { MissionForm } from "@/components/forms/mission-form";

export default async function EditMissionPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: mission } = await supabase.from("missions").select("*").eq("id", params.id).eq("organisation_id", profile.organisation_id).single();
  if (!mission) notFound();

  const { data: logements } = await supabase.from("logements").select("*").eq("organisation_id", profile.organisation_id).eq("status", "ACTIF").order("name");
  const { data: profiles } = await supabase.from("profiles").select("*").eq("organisation_id", profile.organisation_id).order("full_name");

  return (
    <div>
      <PageHeader
        title="Modifier la mission"
        showCreate={false}
        showBack={true}
        backHref={`/missions/${params.id}`}
      />
      <MissionForm mission={mission} logements={logements ?? []} profiles={profiles ?? []} isAdmin={isAdmin(profile)} currentUserId={profile.id} />
    </div>
  );
}
