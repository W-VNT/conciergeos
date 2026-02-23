import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LogementForm } from "@/components/forms/logement-form";

export const metadata = { title: "Nouveau logement" };

export default async function NewLogementPage() {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/logements");

  const supabase = await createClient();
  const { data: proprietaires } = await supabase.from("proprietaires").select("*").eq("organisation_id", profile.organisation_id).order("full_name");

  return (
    <div>
      <PageHeader
        title="Nouveau logement"
        showCreate={false}
        showBack={true}
        backHref="/logements"
      />
      <LogementForm proprietaires={proprietaires ?? []} />
    </div>
  );
}
