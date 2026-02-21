"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { INCIDENT_STATUS_LABELS, INCIDENT_SEVERITY_LABELS } from "@/types/database";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { BulkActionsToolbar, type BulkAction } from "@/components/shared/bulk-actions-toolbar";
import { CheckCircle, UserPlus, Trash2 } from "lucide-react";
import { bulkCloseIncidents, bulkAssignIncidents, bulkDeleteIncidents } from "@/lib/actions/incidents";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format-date";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Incident {
  id: string;
  description: string;
  severity: string;
  status: string;
  opened_at: string;
  logement?: { name: string } | null;
  prestataire?: { full_name: string } | null;
}

interface Prestataire {
  id: string;
  full_name: string;
  email: string;
}

interface Props {
  incidents: Incident[];
  organisationId: string;
}

export function IncidentsTableWithSelection({ incidents, organisationId }: Props) {
  const {
    selectedIds,
    toggleSelection,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    selectedCount,
  } = useBulkSelection({ items: incidents });

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [selectedPrestataire, setSelectedPrestataire] = useState<string>("");

  useEffect(() => {
    if (assignDialogOpen) {
      loadPrestataires();
    }
  }, [assignDialogOpen]);

  const loadPrestataires = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("prestataires")
      .select("id, full_name, email")
      .eq("organisation_id", organisationId)
      .order("full_name");

    setPrestataires(data || []);
  };

  const handleBulkClose = async () => {
    setLoading(true);

    const result = await bulkCloseIncidents(selectedIds);

    setLoading(false);
    setCloseDialogOpen(false);

    if (result.success) {
      toast.success(result.message);
      clearSelection();
    } else {
      toast.error(result.error);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedPrestataire) return;

    setLoading(true);

    const result = await bulkAssignIncidents({
      incident_ids: selectedIds,
      prestataire_id: selectedPrestataire,
      organisation_id: organisationId,
    });

    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      setAssignDialogOpen(false);
      clearSelection();
    } else {
      toast.error(result.error);
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);

    const result = await bulkDeleteIncidents(selectedIds);

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
      label: "Assigner à...",
      icon: <UserPlus className="h-4 w-4 mr-2" />,
      onClick: () => setAssignDialogOpen(true),
      variant: "outline",
      disabled: loading,
    },
    {
      label: "Clôturer",
      icon: <CheckCircle className="h-4 w-4 mr-2" />,
      onClick: () => setCloseDialogOpen(true),
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
          entityName="incident"
          actions={bulkActions}
          onClear={clearSelection}
        />
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {incidents.map((incident) => {
          const isLate = !["RESOLU", "CLOS"].includes(incident.status) &&
            (Date.now() - new Date(incident.opened_at).getTime()) > 7 * 24 * 60 * 60 * 1000;
          const logement = Array.isArray(incident.logement) ? incident.logement[0] : incident.logement;
          const prestataire = Array.isArray(incident.prestataire) ? incident.prestataire[0] : incident.prestataire;

          return (
            <div
              key={incident.id}
              className={cn(
                "border rounded-lg p-3 bg-card transition-colors",
                isSelected(incident.id) && "bg-primary/5 border-primary/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Checkbox checked={isSelected(incident.id)} onCheckedChange={() => toggleSelection(incident.id)} />
                <StatusBadge
                  value={incident.severity}
                  label={INCIDENT_SEVERITY_LABELS[incident.severity as keyof typeof INCIDENT_SEVERITY_LABELS]}
                />
                {isLate && <Badge variant="destructive" className="text-xs">En retard</Badge>}
                <StatusBadge
                  value={incident.status}
                  label={INCIDENT_STATUS_LABELS[incident.status as keyof typeof INCIDENT_STATUS_LABELS]}
                  className="ml-auto"
                />
              </div>
              <Link href={`/incidents/${incident.id}`} className="block pl-8">
                <p className="font-medium text-sm line-clamp-2">{incident.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{logement?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {prestataire?.full_name ?? "—"} · {formatDate(incident.opened_at)}
                </p>
              </Link>
            </div>
          );
        })}
        {incidents.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Aucun incident trouvé</p>
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
              <TableHead>Sévérité</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Logement</TableHead>
              <TableHead>Prestataire</TableHead>
              <TableHead>Ouvert le</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => {
              const isLate = !["RESOLU", "CLOS"].includes(incident.status) &&
                (Date.now() - new Date(incident.opened_at).getTime()) > 7 * 24 * 60 * 60 * 1000;

              // Normalize joined data (Supabase can return arrays)
              const logement = Array.isArray(incident.logement)
                ? incident.logement[0]
                : incident.logement;
              const prestataire = Array.isArray(incident.prestataire)
                ? incident.prestataire[0]
                : incident.prestataire;

              return (
                <TableRow
                  key={incident.id}
                  className={isSelected(incident.id) ? "bg-primary/5" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected(incident.id)}
                      onCheckedChange={() => toggleSelection(incident.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      value={incident.severity}
                      label={INCIDENT_SEVERITY_LABELS[incident.severity as keyof typeof INCIDENT_SEVERITY_LABELS]}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/incidents/${incident.id}`} className="font-medium hover:underline">
                        {incident.description?.slice(0, 50)}
                      </Link>
                      {isLate && <Badge variant="destructive" className="text-xs">En retard</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{logement?.name ?? "—"}</TableCell>
                  <TableCell>{prestataire?.full_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(incident.opened_at)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      value={incident.status}
                      label={INCIDENT_STATUS_LABELS[incident.status as keyof typeof INCIDENT_STATUS_LABELS]}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {incidents.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aucun incident trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assigner {selectedCount} incident{selectedCount > 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <RadioGroup value={selectedPrestataire} onValueChange={setSelectedPrestataire}>
              {prestataires.map((prestataire) => (
                <div key={prestataire.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={prestataire.id} id={prestataire.id} />
                  <Label htmlFor={prestataire.id} className="flex-1 cursor-pointer">
                    {prestataire.full_name}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {prestataires.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun prestataire disponible
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleBulkAssign}
                disabled={!selectedPrestataire || loading}
              >
                Assigner
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Clôturer {selectedCount} incident{selectedCount > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Les incidents seront marqués comme clôturés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkClose}
              disabled={loading}
            >
              Clôturer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selectedCount} incident{selectedCount > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les incidents seront définitivement supprimés.
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
