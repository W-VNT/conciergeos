import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getMissionTemplate } from "@/lib/actions/mission-templates";
import { MissionTemplateFormClient } from "@/components/missions/mission-template-form";
import type { MissionTemplate, Logement } from "@/types/database";

export const metadata = { title: "Nouveau modèle de mission" };

export default async function NewMissionTemplatePage({
  searchParams,
}: {
  searchParams: { edit?: string };
}) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/missions");

  const supabase = createClient();

  // Fetch logements for select
  const { data: logements } = await supabase
    .from("logements")
    .select("id, name")
    .eq("organisation_id", profile.organisation_id)
    .eq("status", "ACTIF")
    .order("name");

  // If editing, fetch existing template
  let template: MissionTemplate | null = null;
  if (searchParams.edit) {
    template = await getMissionTemplate(searchParams.edit);
  }

  const isEditing = !!template;

  return (
    <div className="space-y-4">
      <PageHeader
        title={isEditing ? "Modifier le modèle" : "Nouveau modèle de mission"}
        showCreate={false}
        showBack
        backHref="/missions/templates"
        entityName={isEditing ? template!.name : "Nouveau modèle"}
      />

      <MissionTemplateFormClient
        logements={(logements ?? []) as Pick<Logement, "id" | "name">[]}
        template={template}
      />
    </div>
  );
}
