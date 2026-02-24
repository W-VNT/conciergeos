import { requireProfile, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ContratTemplateForm } from "@/components/contrats/contrat-template-form";

export const metadata = { title: "Nouveau mod\u00e8le de contrat" };

export default async function NewContratTemplatePage() {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/contrats");

  return (
    <div>
      <PageHeader
        title="Nouveau mod\u00e8le"
        showCreate={false}
        showBack={true}
        backHref="/contrats/templates"
      />
      <ContratTemplateForm />
    </div>
  );
}
