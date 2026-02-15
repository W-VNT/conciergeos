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

  // Fetch logements
  const { data: logements } = await supabase
    .from("logements")
    .select("*")
    .eq("status", "ACTIF")
    .order("name");

  return (
    <div>
      <PageHeader title="Nouveau contrat" />
      <ContratForm
        proprietaires={proprietaires ?? []}
        logements={logements ?? []}
      />
    </div>
  );
}
