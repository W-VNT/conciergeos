import { requireProfile, isAdmin } from "@/lib/auth";
import { getContratTemplates, deleteContratTemplate } from "@/lib/actions/contrat-templates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";

export const metadata = { title: "Mod\u00e8les de contrats" };

export const dynamic = "force-dynamic";

export default async function ContratTemplatesPage() {
  const profile = await requireProfile();
  const admin = isAdmin(profile);

  if (!admin) redirect("/contrats");

  const templates = await getContratTemplates();

  return (
    <div>
      <PageHeader
        title="Mod\u00e8les de contrats"
        createHref="/contrats/templates/new"
        createLabel="Nouveau mod\u00e8le"
        showCreate={true}
        showBack={true}
        backHref="/contrats"
      />

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {templates.map((t) => (
          <div key={t.id} className="border rounded-lg p-3 bg-card">
            <Link href={`/contrats/templates/${t.id}`} className="block">
              <p className="font-medium text-sm">{t.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cat\u00e9gorie : {t.category}
              </p>
              <p className="text-xs text-muted-foreground">
                Cr\u00e9\u00e9 le {new Date(t.created_at).toLocaleDateString("fr-FR")}
              </p>
            </Link>
          </div>
        ))}
        {templates.length === 0 && (
          <EmptyState
            variant="inline"
            icon={FileText}
            title="Aucun mod\u00e8le"
            description="Cr\u00e9ez un mod\u00e8le de contrat pour standardiser vos documents"
            action={{ label: "Nouveau mod\u00e8le", href: "/contrats/templates/new" }}
          />
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Cat\u00e9gorie</TableHead>
              <TableHead>Date de cr\u00e9ation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link
                    href={`/contrats/templates/${t.id}`}
                    className="font-medium hover:underline"
                  >
                    {t.name}
                  </Link>
                </TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>
                  {new Date(t.created_at).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/contrats/templates/${t.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteConfirmDialog
                      entityType="mod\u00e8le"
                      entityName={t.name}
                      deleteAction={async () => {
                        "use server";
                        return await deleteContratTemplate(t.id);
                      }}
                      redirectPath="/contrats/templates"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && (
              <EmptyState
                icon={FileText}
                title="Aucun mod\u00e8le"
                description="Cr\u00e9ez un mod\u00e8le de contrat pour standardiser vos documents"
                colSpan={4}
              />
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
