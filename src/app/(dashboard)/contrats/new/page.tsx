import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ContratForm } from "@/components/forms/contrat-form";
import { redirect } from "next/navigation";

export default async function NewContratPage() {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/contrats");

  const supabase = createClient();

  // Fetch proprietaires
  const { data: proprietaires } = await supabase
    .from("proprietaires")
    .select("*")
    .order("full_name");

  // Fetch logements + offer configs
  const [{ data: logements }, { data: offerConfigs }] = await Promise.all([
    supabase.from("logements").select("*").eq("status", "ACTIF").order("name"),
    supabase
      .from("offer_tier_configs")
      .select("tier, commission_rate, name")
      .eq("organisation_id", profile.organisation_id),
  ]);

  return (
    <div>
      <PageHeader title="Nouveau contrat" />
      <ContratForm
        proprietaires={proprietaires ?? []}
        logements={logements ?? []}
        offerConfigs={offerConfigs ?? []}
      />
    </div>
  );
}
