"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ETAT_DES_LIEUX_TYPE_LABELS, type EtatDesLieuxType } from "@/types/database";
import { createEtatDesLieux } from "@/lib/actions/etats-des-lieux";
import { toast } from "sonner";

interface EdlNewFormProps {
  logements: Array<{ id: string; name: string }>;
  reservations: Array<{ id: string; guest_name: string; logement_id: string }>;
}

export function EdlNewForm({ logements, reservations }: EdlNewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logementId, setLogementId] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [type, setType] = useState<string>("ENTREE");
  const [notes, setNotes] = useState("");

  // Filter reservations by selected logement
  const filteredReservations = logementId
    ? reservations.filter((r) => r.logement_id === logementId)
    : reservations;

  function handleSubmit() {
    if (!logementId) {
      toast.error("Veuillez sélectionner un logement");
      return;
    }
    startTransition(async () => {
      const res = await createEtatDesLieux({
        logement_id: logementId,
        reservation_id: reservationId || "",
        type: type as "ENTREE" | "SORTIE",
        notes,
      });
      if (res.success && res.data) {
        toast.success(res.message);
        router.push(`/etats-des-lieux/${res.data.id}`);
      } else {
        toast.error(res.error ?? "Erreur lors de la création");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvel état des lieux</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Logement *</Label>
          <Select value={logementId} onValueChange={setLogementId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un logement" />
            </SelectTrigger>
            <SelectContent>
              {logements.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Réservation (optionnel)</Label>
          <Select value={reservationId} onValueChange={setReservationId}>
            <SelectTrigger>
              <SelectValue placeholder="Aucune réservation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Aucune</SelectItem>
              {filteredReservations.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.guest_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Type *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(ETAT_DES_LIEUX_TYPE_LABELS) as [
                  EtatDesLieuxType,
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes générales..."
          />
        </div>

        <Button
          className="w-full"
          disabled={isPending || !logementId}
          onClick={handleSubmit}
        >
          {isPending ? "Création..." : "Créer l'état des lieux"}
        </Button>
      </CardContent>
    </Card>
  );
}
