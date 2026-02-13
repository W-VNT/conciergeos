import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProprietaireForm } from "@/components/forms/proprietaire-form";

export default async function EditProprietairePage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/proprietaires");

  const supabase = createClient();
  const { data } = await supabase.from("proprietaires").select("*").eq("id", params.id).single();
  if (!data) notFound();

  return (
    <div>
      <PageHeader title="Modifier le propriétaire" showCreate={false} />
      <ProprietaireForm proprietaire={data} />
    </div>
  );
}
