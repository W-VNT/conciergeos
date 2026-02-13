import { requireProfile, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProprietaireForm } from "@/components/forms/proprietaire-form";

export default async function NewProprietairePage() {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/proprietaires");

  return (
    <div>
      <PageHeader title="Nouveau propriétaire" showCreate={false} />
      <ProprietaireForm />
    </div>
  );
}
