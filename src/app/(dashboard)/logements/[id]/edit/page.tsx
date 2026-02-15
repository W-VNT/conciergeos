import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LogementForm } from "@/components/forms/logement-form";

export default async function EditLogementPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/logements");

  const supabase = createClient();
  const { data: logement } = await supabase.from("logements").select("*").eq("id", params.id).single();
  if (!logement) notFound();

  const { data: proprietaires } = await supabase.from("proprietaires").select("*").order("full_name");

  return (
    <div>
      <PageHeader
        title="Modifier le logement"
        showCreate={false}
        showBack={true}
        backHref={`/logements/${params.id}`}
      />
      <LogementForm logement={logement} proprietaires={proprietaires ?? []} />
    </div>
  );
}
