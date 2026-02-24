"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ETAT_DES_LIEUX_TYPE_LABELS,
  ETAT_DES_LIEUX_STATUS_LABELS,
  ITEM_CONDITION_LABELS,
  type EtatDesLieuxType,
  type EtatDesLieuxStatus,
  type ItemCondition,
} from "@/types/database";
import {
  addEtatDesLieuxItem,
  deleteEtatDesLieuxItem,
  signEtatDesLieux,
  validateEtatDesLieux,
} from "@/lib/actions/etats-des-lieux";
import { toast } from "sonner";
import { Plus, Trash2, PenLine, ShieldCheck, Camera, FileText } from "lucide-react";
import { formatDate } from "@/lib/format-date";
import { useRouter } from "next/navigation";

interface EdlItem {
  id: string;
  room: string;
  element: string;
  condition: string;
  photo_urls: string[];
  notes: string | null;
  position: number;
}

interface EdlDetailClientProps {
  edl: {
    id: string;
    type: string;
    status: string;
    notes: string | null;
    guest_signature_url: string | null;
    inspector_signature_url: string | null;
    completed_at: string | null;
    created_at: string;
    logement: { id: string; name: string } | null;
    reservation: { id: string; guest_name: string } | null;
    inspector: { id: string; full_name: string } | null;
    items: EdlItem[];
  };
  isAdmin: boolean;
}

export function EdlDetailClient({ edl, isAdmin }: EdlDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    room: "",
    element: "",
    condition: "BON" as string,
    notes: "",
  });

  function handleAddItem() {
    if (!newItem.room || !newItem.element) {
      toast.error("Pièce et élément sont requis");
      return;
    }
    startTransition(async () => {
      const res = await addEtatDesLieuxItem(edl.id, {
        room: newItem.room,
        element: newItem.element,
        condition: newItem.condition as "BON" | "CORRECT" | "DEGRADE" | "MAUVAIS",
        notes: newItem.notes,
      });
      if (res.success) {
        toast.success(res.message);
        setNewItem({ room: "", element: "", condition: "BON", notes: "" });
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDeleteItem(itemId: string) {
    startTransition(async () => {
      const res = await deleteEtatDesLieuxItem(itemId);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleSign(type: "guest" | "inspector") {
    const placeholderUrl = `https://signatures.conciergeos.app/${edl.id}/${type}/${Date.now()}`;
    startTransition(async () => {
      const res = await signEtatDesLieux(edl.id, type, placeholderUrl);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleValidate() {
    startTransition(async () => {
      const res = await validateEtatDesLieux(edl.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const isDraft = edl.status === "BROUILLON";

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Logement</span>
              <span className="font-medium">{edl.logement?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <StatusBadge
                value={edl.type}
                label={ETAT_DES_LIEUX_TYPE_LABELS[edl.type as EtatDesLieuxType]}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statut</span>
              <StatusBadge
                value={edl.status}
                label={ETAT_DES_LIEUX_STATUS_LABELS[edl.status as EtatDesLieuxStatus]}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Voyageur</span>
              <span>{edl.reservation?.guest_name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inspecteur</span>
              <span>{edl.inspector?.full_name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDate(edl.created_at)}</span>
            </div>
            {edl.notes && (
              <div>
                <span className="text-muted-foreground block mb-1">Notes</span>
                <p>{edl.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signatures & Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Signature voyageur</span>
              {edl.guest_signature_url ? (
                <Badge variant="secondary" className="bg-green-500/15 text-green-700">Signée</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending || !isDraft}
                  onClick={() => handleSign("guest")}
                >
                  <PenLine className="h-4 w-4 mr-1" />
                  Signer
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Signature inspecteur</span>
              {edl.inspector_signature_url ? (
                <Badge variant="secondary" className="bg-green-500/15 text-green-700">Signée</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending || !isDraft}
                  onClick={() => handleSign("inspector")}
                >
                  <PenLine className="h-4 w-4 mr-1" />
                  Signer
                </Button>
              )}
            </div>
            {isAdmin && edl.status === "SIGNE" && (
              <Button
                className="w-full"
                disabled={isPending}
                onClick={handleValidate}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Valider l&apos;état des lieux
              </Button>
            )}
            {edl.completed_at && (
              <p className="text-xs text-muted-foreground">
                Complété le {formatDate(edl.completed_at)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Éléments ({edl.items.length})
          </CardTitle>
          {isDraft && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un élément</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Pièce</Label>
                    <Input
                      value={newItem.room}
                      onChange={(e) =>
                        setNewItem((prev) => ({ ...prev, room: e.target.value }))
                      }
                      placeholder="Ex: Salon, Chambre 1..."
                    />
                  </div>
                  <div>
                    <Label>Élément</Label>
                    <Input
                      value={newItem.element}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          element: e.target.value,
                        }))
                      }
                      placeholder="Ex: Murs, Sol, Fenêtre..."
                    />
                  </div>
                  <div>
                    <Label>État</Label>
                    <Select
                      value={newItem.condition}
                      onValueChange={(v) =>
                        setNewItem((prev) => ({ ...prev, condition: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(ITEM_CONDITION_LABELS) as [
                            ItemCondition,
                            string,
                          ][]
                        ).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={newItem.notes}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Observations..."
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={isPending}
                    onClick={handleAddItem}
                  >
                    Ajouter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {edl.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun élément. Ajoutez des éléments pour chaque pièce.
            </p>
          ) : (
            <div className="space-y-3">
              {edl.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 p-3 border rounded-lg"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{item.room}</span>
                      <span className="text-muted-foreground text-sm">—</span>
                      <span className="text-sm">{item.element}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge
                        value={item.condition}
                        label={
                          ITEM_CONDITION_LABELS[
                            item.condition as ItemCondition
                          ]
                        }
                      />
                      {item.photo_urls && item.photo_urls.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Camera className="h-3 w-3" />
                          {item.photo_urls.length}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  {isDraft && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive shrink-0"
                      disabled={isPending}
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
