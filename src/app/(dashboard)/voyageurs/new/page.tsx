import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { VoyageurForm } from "@/components/forms/voyageur-form";

export default async function NewVoyageurPage() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/voyageurs");

  return (
    <div>
      <PageHeader title="Nouveau voyageur" showCreate={false} showBack={true} backHref="/voyageurs" />
      <VoyageurForm />
    </div>
  );
}
