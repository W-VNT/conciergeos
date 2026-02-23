import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ContratForm } from "@/components/forms/contrat-form";

export const dynamic = "force-dynamic";

export default async function EditContratPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect(`/contrats/${params.id}`);

  const supabase = createClient();

  // Fetch contrat
  const { data: contrat } = await supabase
    .from("contrats")
    .select("*")
    .eq("id", params.id)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (!contrat) notFound();

  // Signed contracts cannot be edited
  if (contrat.status === "SIGNE") redirect(`/contrats/${params.id}`);

  // Fetch proprietaires
  const { data: proprietaires } = await supabase
    .from("proprietaires")
    .select("*")
    .eq("organisation_id", profile.organisation_id)
    .order("full_name");

  // Fetch logements + offer configs
  const [{ data: logements }, { data: offerConfigs }] = await Promise.all([
    supabase.from("logements").select("*").eq("organisation_id", profile.organisation_id).order("name"),
    supabase
      .from("offer_tier_configs")
      .select("tier, commission_rate, name")
      .eq("organisation_id", profile.organisation_id),
  ]);

  return (
    <div>
      <PageHeader title="Modifier le contrat" />
      <ContratForm
        contrat={contrat}
        proprietaires={proprietaires ?? []}
        logements={logements ?? []}
        offerConfigs={offerConfigs ?? []}
      />
    </div>
  );
}
