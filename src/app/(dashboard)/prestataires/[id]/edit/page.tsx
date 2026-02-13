import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PrestataireForm } from "@/components/forms/prestataire-form";

export default async function EditPrestatairePage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/prestataires");

  const supabase = createClient();
  const { data } = await supabase.from("prestataires").select("*").eq("id", params.id).single();
  if (!data) notFound();

  return (
    <div>
      <PageHeader title="Modifier le prestataire" showCreate={false} />
      <PrestataireForm prestataire={data} />
    </div>
  );
}
