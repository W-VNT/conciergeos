"use client";

import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RESERVATION_STATUS_LABELS, BOOKING_PLATFORM_LABELS } from "@/types/database";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { BulkActionsToolbar, type BulkAction } from "@/components/shared/bulk-actions-toolbar";
import { Ban, Trash2, CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { bulkCancelReservations, bulkDeleteReservations } from "@/lib/actions/reservations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format-date";
import { formatCurrencyDecimals as formatEur } from "@/lib/format-currency";
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

interface Reservation {
  id: string;
  guest_name: string;
  guest_count: number;
  check_in_date: string;
  check_out_date: string;
  platform: string;
  status: string;
  amount: number | null;
  logement_id: string | null;
  logement?: { name: string } | null;
}

interface Props {
  reservations: Reservation[];
}

export function ReservationsTableWithSelection({ reservations }: Props) {
  const {
    selectedIds,
    toggleSelection,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    selectedCount,
  } = useBulkSelection({ items: reservations });

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBulkCancel = async () => {
    setLoading(true);

    const result = await bulkCancelReservations(selectedIds);

    setLoading(false);
    setCancelDialogOpen(false);

    if (result.success) {
      toast.success(result.message);
      clearSelection();
    } else {
      toast.error(result.error);
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);

    const result = await bulkDeleteReservations(selectedIds);

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
      label: "Annuler",
      icon: <Ban className="h-4 w-4 mr-2" />,
      onClick: () => setCancelDialogOpen(true),
      variant: "outline",
      disabled: loading,
    },
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
          entityName="réservation"
          actions={bulkActions}
          onClear={clearSelection}
        />
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {reservations.map((reservation) => {
          const nights = Math.ceil(
            (new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const logement = Array.isArray(reservation.logement) ? reservation.logement[0] : reservation.logement;

          return (
            <div
              key={reservation.id}
              className={cn(
                "border rounded-lg p-3 bg-card transition-colors",
                isSelected(reservation.id) && "bg-primary/5 border-primary/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Checkbox checked={isSelected(reservation.id)} onCheckedChange={() => toggleSelection(reservation.id)} />
                <StatusBadge
                  value={reservation.platform}
                  label={BOOKING_PLATFORM_LABELS[reservation.platform as keyof typeof BOOKING_PLATFORM_LABELS]}
                />
                <StatusBadge
                  value={reservation.status}
                  label={RESERVATION_STATUS_LABELS[reservation.status as keyof typeof RESERVATION_STATUS_LABELS]}
                  className="ml-auto"
                />
              </div>
              <Link href={`/reservations/${reservation.id}`} className="block pl-8">
                <p className="font-medium text-sm">{reservation.guest_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{logement?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(reservation.check_in_date)} — {formatDate(reservation.check_out_date)} · {nights} nuit{nights > 1 ? "s" : ""}
                </p>
              </Link>
              {reservation.amount && (
                <div className="pl-8 mt-2 pt-2 border-t">
                  <p className="text-sm font-medium">{formatEur(reservation.amount)}</p>
                </div>
              )}
            </div>
          );
        })}
        {reservations.length === 0 && (
          <EmptyState
            variant="inline"
            icon={CalendarDays}
            title="Aucune réservation trouvée"
            description="Ajustez vos filtres ou ajoutez une réservation"
            action={{ label: "Nouvelle réservation", href: "/reservations/new" }}
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
              <TableHead>Voyageur</TableHead>
              <TableHead>Logement</TableHead>
              <TableHead>Arrivée - Départ</TableHead>
              <TableHead>Voyageurs</TableHead>
              <TableHead>Plateforme</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => {
              const nights = Math.ceil(
                (new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              // Normalize joined data (Supabase can return arrays)
              const logement = Array.isArray(reservation.logement)
                ? reservation.logement[0]
                : reservation.logement;

              return (
                <TableRow
                  key={reservation.id}
                  className={isSelected(reservation.id) ? "bg-primary/5" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected(reservation.id)}
                      onCheckedChange={() => toggleSelection(reservation.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/reservations/${reservation.id}`} className="font-medium hover:underline">
                      {reservation.guest_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {reservation.logement_id ? (
                      <Link
                        href={`/logements/${reservation.logement_id}`}
                        className="text-primary hover:underline"
                      >
                        {logement?.name ?? "—"}
                      </Link>
                    ) : (
                      <span>—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      {formatDate(reservation.check_in_date)} —{" "}
                      {formatDate(reservation.check_out_date)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {nights} nuit{nights > 1 ? "s" : ""}
                    </div>
                  </TableCell>
                  <TableCell>{reservation.guest_count}</TableCell>
                  <TableCell>
                    <StatusBadge
                      value={reservation.platform}
                      label={BOOKING_PLATFORM_LABELS[reservation.platform as keyof typeof BOOKING_PLATFORM_LABELS]}
                    />
                  </TableCell>
                  <TableCell>{reservation.amount ? formatEur(reservation.amount) : "—"}</TableCell>
                  <TableCell>
                    <StatusBadge
                      value={reservation.status}
                      label={RESERVATION_STATUS_LABELS[reservation.status as keyof typeof RESERVATION_STATUS_LABELS]}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {reservations.length === 0 && (
              <EmptyState
                variant="table"
                icon={CalendarDays}
                title="Aucune réservation trouvée"
                colSpan={8}
              />
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Annuler {selectedCount} réservation{selectedCount > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Les réservations seront marquées comme annulées et leurs missions associées seront annulées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler l'action</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkCancel}
              disabled={loading}
            >
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selectedCount} réservation{selectedCount > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les réservations et leurs missions associées seront définitivement supprimées.
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
