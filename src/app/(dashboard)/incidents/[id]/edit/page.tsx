import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { IncidentForm } from "@/components/forms/incident-form";

export default async function EditIncidentPage({ params }: { params: { id: string } }) {
  await requireProfile();
  const supabase = createClient();

  const { data: incident } = await supabase.from("incidents").select("*").eq("id", params.id).single();
  if (!incident) notFound();

  const { data: logements } = await supabase.from("logements").select("*").order("name");
  const { data: prestataires } = await supabase.from("prestataires").select("*").order("full_name");

  return (
    <div>
      <PageHeader
        title="Modifier l&apos;incident"
        showCreate={false}
        showBack={true}
        backHref={`/incidents/${params.id}`}
      />
      <IncidentForm incident={incident} logements={logements ?? []} prestataires={prestataires ?? []} />
    </div>
  );
}
