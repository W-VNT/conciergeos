"use client";

import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LOGEMENT_STATUS_LABELS, OFFER_TIER_LABELS } from "@/types/database";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { BulkActionsToolbar, type BulkAction } from "@/components/shared/bulk-actions-toolbar";
import { Trash2, Home } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { bulkDeleteLogements } from "@/lib/actions/logements";
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

interface Logement {
  id: string;
  name: string;
  city: string | null;
  status: string;
  offer_tier: string;
  proprietaire?: { full_name: string } | null;
}

interface Props {
  logements: Logement[];
}

export function LogementsTableWithSelection({ logements }: Props) {
  const {
    selectedIds,
    toggleSelection,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    selectedCount,
  } = useBulkSelection({ items: logements });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    setLoading(true);

    const result = await bulkDeleteLogements(selectedIds);

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
          entityName="logement"
          actions={bulkActions}
          onClear={clearSelection}
        />
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {logements.map((l) => {
          const proprietaire = Array.isArray(l.proprietaire) ? l.proprietaire[0] : l.proprietaire;
          return (
            <div
              key={l.id}
              className={cn(
                "border rounded-lg p-3 bg-card transition-colors",
                isSelected(l.id) && "bg-primary/5 border-primary/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Checkbox checked={isSelected(l.id)} onCheckedChange={() => toggleSelection(l.id)} />
                <StatusBadge value={l.offer_tier} label={OFFER_TIER_LABELS[l.offer_tier as keyof typeof OFFER_TIER_LABELS]} />
                <StatusBadge value={l.status} label={LOGEMENT_STATUS_LABELS[l.status as keyof typeof LOGEMENT_STATUS_LABELS]} className="ml-auto" />
              </div>
              <Link href={`/logements/${l.id}`} className="block pl-8">
                <p className="font-medium text-sm">{l.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {l.city ?? "—"} — {proprietaire?.full_name ?? "—"}
                </p>
              </Link>
            </div>
          );
        })}
        {logements.length === 0 && (
          <EmptyState
            variant="inline"
            icon={Home}
            title="Aucun logement trouvé"
            description="Ajoutez votre premier logement pour commencer"
            action={{ label: "Ajouter un logement", href: "/logements/new" }}
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
              <TableHead>Nom</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Propriétaire</TableHead>
              <TableHead>Offre</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logements.map((logement) => {
              const proprietaire = Array.isArray(logement.proprietaire)
                ? logement.proprietaire[0]
                : logement.proprietaire;

              return (
                <TableRow
                  key={logement.id}
                  className={isSelected(logement.id) ? "bg-primary/5" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected(logement.id)}
                      onCheckedChange={() => toggleSelection(logement.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/logements/${logement.id}`} className="font-medium hover:underline">
                      {logement.name}
                    </Link>
                  </TableCell>
                  <TableCell>{logement.city ?? "—"}</TableCell>
                  <TableCell>{proprietaire?.full_name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge
                      value={logement.offer_tier}
                      label={OFFER_TIER_LABELS[logement.offer_tier as keyof typeof OFFER_TIER_LABELS]}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      value={logement.status}
                      label={LOGEMENT_STATUS_LABELS[logement.status as keyof typeof LOGEMENT_STATUS_LABELS]}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {logements.length === 0 && (
              <EmptyState
                variant="table"
                icon={Home}
                title="Aucun logement trouvé"
                colSpan={6}
              />
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selectedCount} logement{selectedCount > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les logements seront définitivement supprimés.
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
