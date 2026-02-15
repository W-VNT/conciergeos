import { requireProfile, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PrestataireForm } from "@/components/forms/prestataire-form";

export default async function NewPrestatairePage() {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/prestataires");

  return (
    <div>
      <PageHeader title="Nouveau prestataire" showCreate={false} showBack={true} backHref="/prestataires" />
      <PrestataireForm />
    </div>
  );
}
