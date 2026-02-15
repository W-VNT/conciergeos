import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { MissionForm } from "@/components/forms/mission-form";

export default async function NewMissionPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: logements } = await supabase.from("logements").select("*").eq("status", "ACTIF").order("name");
  const { data: profiles } = await supabase.from("profiles").select("*").order("full_name");

  return (
    <div>
      <PageHeader
        title="Nouvelle mission"
        showCreate={false}
        showBack={true}
        backHref="/missions"
      />
      <MissionForm logements={logements ?? []} profiles={profiles ?? []} isAdmin={isAdmin(profile)} currentUserId={profile.id} />
    </div>
  );
}
