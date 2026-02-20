"use client";

import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STATUT_JURIDIQUE_LABELS } from "@/types/database";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { BulkActionsToolbar, type BulkAction } from "@/components/shared/bulk-actions-toolbar";
import { Trash2 } from "lucide-react";
import { bulkDeleteProprietaires } from "@/lib/actions/proprietaires";
import { toast } from "sonner";
import { formatPhone } from "@/lib/utils";
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

interface Proprietaire {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  statut_juridique: string;
}

interface Props {
  proprietaires: Proprietaire[];
}

export function ProprietairesTableWithSelection({ proprietaires }: Props) {
  const {
    selectedIds,
    toggleSelection,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    selectedCount,
  } = useBulkSelection({ items: proprietaires });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    setLoading(true);

    const result = await bulkDeleteProprietaires(selectedIds);

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
          entityName="propriétaire"
          actions={bulkActions}
          onClear={clearSelection}
        />
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Statut juridique</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proprietaires.map((proprietaire) => (
              <TableRow
                key={proprietaire.id}
                className={isSelected(proprietaire.id) ? "bg-primary/5" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected(proprietaire.id)}
                    onCheckedChange={() => toggleSelection(proprietaire.id)}
                  />
                </TableCell>
                <TableCell>
                  <Link href={`/proprietaires/${proprietaire.id}`} className="font-medium hover:underline">
                    {proprietaire.full_name}
                  </Link>
                </TableCell>
                <TableCell>{formatPhone(proprietaire.phone)}</TableCell>
                <TableCell>{proprietaire.email ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge
                    value={proprietaire.statut_juridique}
                    label={STATUT_JURIDIQUE_LABELS[proprietaire.statut_juridique as keyof typeof STATUT_JURIDIQUE_LABELS]}
                  />
                </TableCell>
              </TableRow>
            ))}
            {proprietaires.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Aucun propriétaire trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selectedCount} propriétaire{selectedCount > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les propriétaires seront définitivement supprimés.
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
