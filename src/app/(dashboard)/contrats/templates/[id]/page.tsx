import { requireProfile, isAdmin } from "@/lib/auth";
import { getContratTemplate } from "@/lib/actions/contrat-templates";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ContratTemplateForm } from "@/components/contrats/contrat-template-form";

export const metadata = { title: "Modifier le mod\u00e8le de contrat" };

export default async function EditContratTemplatePage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/contrats");

  const template = await getContratTemplate(params.id);
  if (!template) notFound();

  return (
    <div>
      <PageHeader
        title="Modifier le mod\u00e8le"
        showCreate={false}
        showBack={true}
        backHref="/contrats/templates"
        entityName={template.name}
      />
      <ContratTemplateForm template={template} />
    </div>
  );
}
