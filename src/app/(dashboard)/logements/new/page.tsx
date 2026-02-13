import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LogementForm } from "@/components/forms/logement-form";

export default async function NewLogementPage() {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/logements");

  const supabase = createClient();
  const { data: proprietaires } = await supabase.from("proprietaires").select("*").order("full_name");

  return (
    <div>
      <PageHeader title="Nouveau logement" showCreate={false} />
      <LogementForm proprietaires={proprietaires ?? []} />
    </div>
  );
}
