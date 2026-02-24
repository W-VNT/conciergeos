"use client";

import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import { SortableHeader } from "@/components/shared/sortable-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SPECIALTY_LABELS } from "@/types/database";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { BulkActionsToolbar, type BulkAction } from "@/components/shared/bulk-actions-toolbar";
import { Trash2, Star, Wrench } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { bulkDeletePrestataires } from "@/lib/actions/prestataires";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Prestataire {
  id: string;
  full_name: string;
  specialty: string;
  statut_juridique: string | null;
  phone: string | null;
  city: string | null;
  hourly_rate: number | null;
  reliability_score: number | null;
}

interface Props {
  prestataires: Prestataire[];
}

export function PrestatairesTableWithSelection({ prestataires }: Props) {
  const {
    selectedIds,
    toggleSelection,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    selectedCount,
  } = useBulkSelection({ items: prestataires });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    setLoading(true);

    const result = await bulkDeletePrestataires(selectedIds);

    setLoading(false);
    setDeleteDialogOpen(false);

    if (result.success) {
      toast.success(result.message);
      clearSelection();
    } else {
      toast.error(result.error);
    }
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Supprimer",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: () => setDeleteDialogOpen(true),
      variant: "destructive",
      disabled: loading,
    },
  ];

  return (
    <div className="space-y-4">
      {selectedCount > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedCount}
          entityName="prestataire"
          actions={bulkActions}
          onClear={clearSelection}
        />
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {prestataires.map((p) => (
          <div
            key={p.id}
            className={cn(
              "border rounded-lg p-3 bg-card transition-colors",
              isSelected(p.id) && "bg-primary/5 border-primary/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Checkbox checked={isSelected(p.id)} onCheckedChange={() => toggleSelection(p.id)} />
              <StatusBadge
                value={p.specialty}
                label={SPECIALTY_LABELS[p.specialty as keyof typeof SPECIALTY_LABELS]}
              />
              {p.reliability_score && (
                <div className="flex items-center gap-1 ml-auto text-sm">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{p.reliability_score}/5</span>
                </div>
              )}
            </div>
            <Link href={`/prestataires/${p.id}`} className="block pl-8">
              <p className="font-medium text-sm">{p.full_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {p.phone ?? "\u2014"}{p.city && ` \u00b7 ${p.city}`}
              </p>
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                {p.hourly_rate != null && <span>{p.hourly_rate} \u20AC/h</span>}
                {p.statut_juridique && <span>{p.statut_juridique}</span>}
              </div>
            </Link>
          </div>
        ))}
        {prestataires.length === 0 && (
          <EmptyState
            variant="inline"
            icon={Wrench}
            title="Aucun prestataire trouv\u00e9"
            action={{ label: "Ajouter un prestataire", href: "/prestataires/new" }}
          />
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>
                <SortableHeader label="Nom" column="full_name" />
              </TableHead>
              <TableHead>Sp\u00e9cialit\u00e9</TableHead>
              <TableHead>T\u00e9l\u00e9phone</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>
                <SortableHeader label="Taux horaire" column="hourly_rate" />
              </TableHead>
              <TableHead>
                <SortableHeader label="Fiabilit\u00e9" column="score" />
              </TableHead>
              <TableHead>
                <SortableHeader label="Statut juridique" column="statut_juridique" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prestataires.map((prestataire) => (
              <TableRow
                key={prestataire.id}
                className={isSelected(prestataire.id) ? "bg-primary/5" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected(prestataire.id)}
                    onCheckedChange={() => toggleSelection(prestataire.id)}
                  />
                </TableCell>
                <TableCell>
                  <Link href={`/prestataires/${prestataire.id}`} className="font-medium hover:underline">
                    {prestataire.full_name}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    value={prestataire.specialty}
                    label={SPECIALTY_LABELS[prestataire.specialty as keyof typeof SPECIALTY_LABELS]}
                  />
                </TableCell>
                <TableCell>{prestataire.phone ?? "\u2014"}</TableCell>
                <TableCell>{prestataire.city ?? "\u2014"}</TableCell>
                <TableCell>
                  {prestataire.hourly_rate != null ? `${prestataire.hourly_rate} \u20AC/h` : "\u2014"}
                </TableCell>
                <TableCell>
                  {prestataire.reliability_score ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{prestataire.reliability_score}/5</span>
                    </div>
                  ) : (
                    "\u2014"
                  )}
                </TableCell>
                <TableCell>{prestataire.statut_juridique ?? "\u2014"}</TableCell>
              </TableRow>
            ))}
            {prestataires.length === 0 && (
              <EmptyState
                variant="table"
                icon={Wrench}
                title="Aucun prestataire trouv\u00e9"
                colSpan={8}
              />
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selectedCount} prestataire{selectedCount > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irr\u00e9versible. Les prestataires seront d\u00e9finitivement supprim\u00e9s.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
