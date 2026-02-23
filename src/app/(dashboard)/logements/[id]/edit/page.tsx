import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin, getProfile } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LogementForm } from "@/components/forms/logement-form";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const profile = await getProfile();
  if (!profile) return { title: "Modifier le logement" };
  const supabase = await createClient();
  const { data } = await supabase.from("logements").select("name").eq("id", params.id).eq("organisation_id", profile.organisation_id).single();
  return { title: data ? `Modifier ${data.name}` : "Modifier le logement" };
}

export default async function EditLogementPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/logements");

  const supabase = await createClient();
  const [{ data: logement, error: logementError }, { data: proprietaires }] = await Promise.all([
    supabase.from("logements").select("*").eq("id", params.id).eq("organisation_id", profile.organisation_id).single(),
    supabase.from("proprietaires").select("*").eq("organisation_id", profile.organisation_id).order("full_name"),
  ]);
  if (logementError) {
    console.error("Fetch logement error:", logementError);
  }
  if (!logement) notFound();

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
