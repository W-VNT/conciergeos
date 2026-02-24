import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { getMissionTemplates } from "@/lib/actions/mission-templates";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MISSION_TYPE_LABELS, MISSION_PRIORITY_LABELS } from "@/types/database";
import { deleteMissionTemplate } from "@/lib/actions/mission-templates";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Pencil, FileText, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { MissionTemplate } from "@/types/database";

export const metadata = { title: "Modèles de missions" };
export const dynamic = "force-dynamic";

export default async function MissionTemplatesPage() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/missions");

  const templates = await getMissionTemplates();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Modèles de missions"
        description="Créez des modèles réutilisables pour vos missions récurrentes"
        createHref="/missions/templates/new"
        createLabel="Nouveau modèle"
        showBack
        backHref="/missions"
        entityName="Modèles"
      />

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Aucun modèle</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre premier modèle de mission pour gagner du temps.
            </p>
            <Button asChild>
              <Link href="/missions/templates/new">Créer un modèle</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Logement</TableHead>
                  <TableHead className="hidden md:table-cell">Durée estimée</TableHead>
                  <TableHead className="hidden md:table-cell">Priorité</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template: MissionTemplate) => {
                  const logement = template.logement as { id: string; name: string } | null;
                  return (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.name}
                        {template.checklist && template.checklist.length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({template.checklist.length} éléments)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {MISSION_TYPE_LABELS[template.type as keyof typeof MISSION_TYPE_LABELS] ?? template.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {logement ? (
                          <Link
                            href={`/logements/${logement.id}`}
                            className="hover:underline"
                          >
                            {logement.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {template.estimated_duration_minutes ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Clock className="h-3.5 w-3.5" />
                            {template.estimated_duration_minutes} min
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">
                          {MISSION_PRIORITY_LABELS[template.priority as keyof typeof MISSION_PRIORITY_LABELS] ?? template.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/missions/templates/new?edit=${template.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteConfirmDialog
                            entityType="modèle"
                            entityName={template.name}
                            deleteAction={async () => {
                              "use server";
                              return await deleteMissionTemplate(template.id);
                            }}
                            redirectPath="/missions/templates"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
