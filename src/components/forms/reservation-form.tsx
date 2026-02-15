"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reservationSchema, type ReservationFormData } from "@/lib/schemas";
import { createReservation, updateReservation } from "@/lib/actions/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import type { Reservation, Logement } from "@/types/database";
import { BOOKING_PLATFORM_LABELS, RESERVATION_STATUS_LABELS } from "@/types/database";

interface Props {
  reservation?: Reservation;
  logements: Logement[];
}

export function ReservationForm({ reservation, logements }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!reservation;

  const form = useForm<ReservationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(reservationSchema) as any,
    defaultValues: {
      logement_id: reservation?.logement_id ?? "",
      guest_name: reservation?.guest_name ?? "",
      guest_email: reservation?.guest_email ?? "",
      guest_phone: reservation?.guest_phone ?? "",
      guest_count: reservation?.guest_count ?? 1,
      check_in_date: reservation?.check_in_date
        ? new Date(reservation.check_in_date).toISOString().split("T")[0]
        : "",
      check_out_date: reservation?.check_out_date
        ? new Date(reservation.check_out_date).toISOString().split("T")[0]
        : "",
      platform: reservation?.platform ?? "DIRECT",
      amount: reservation?.amount ?? null,
      status: reservation?.status ?? "CONFIRMEE",
      notes: reservation?.notes ?? "",
    },
  });

  async function onSubmit(data: ReservationFormData) {
    setLoading(true);
    try {
      if (isEdit) {
        await updateReservation(reservation!.id, data);
      } else {
        await createReservation(data);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg mb-4">Informations voyageur</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guest_name">
                Nom du voyageur <span className="text-destructive">*</span>
              </Label>
              <Input id="guest_name" {...form.register("guest_name")} />
              {form.formState.errors.guest_name && (
                <p className="text-destructive text-sm mt-1">{form.formState.errors.guest_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="guest_count">Nombre de voyageurs</Label>
              <Input id="guest_count" type="number" min="1" {...form.register("guest_count")} />
            </div>

            <div>
              <Label htmlFor="guest_email">Email</Label>
              <Input id="guest_email" type="email" {...form.register("guest_email")} />
            </div>

            <div>
              <Label htmlFor="guest_phone">Téléphone</Label>
              <Input id="guest_phone" type="tel" {...form.register("guest_phone")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg mb-4">Détails de la réservation</h3>

          <div>
            <Label htmlFor="logement_id">
              Logement <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.watch("logement_id")}
              onValueChange={(value) => form.setValue("logement_id", value)}
            >
              <SelectTrigger id="logement_id">
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
            {form.formState.errors.logement_id && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.logement_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check_in_date">
                Arrivée <span className="text-destructive">*</span>
              </Label>
              <Input id="check_in_date" type="date" {...form.register("check_in_date")} />
              {form.formState.errors.check_in_date && (
                <p className="text-destructive text-sm mt-1">{form.formState.errors.check_in_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="check_out_date">
                Départ <span className="text-destructive">*</span>
              </Label>
              <Input id="check_out_date" type="date" {...form.register("check_out_date")} />
              {form.formState.errors.check_out_date && (
                <p className="text-destructive text-sm mt-1">{form.formState.errors.check_out_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="platform">Plateforme</Label>
              <Select
                value={form.watch("platform")}
                onValueChange={(value) => form.setValue("platform", value as any)}
              >
                <SelectTrigger id="platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BOOKING_PLATFORM_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Montant (€)</Label>
              <Input id="amount" type="number" step="0.01" min="0" {...form.register("amount")} />
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as any)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESERVATION_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.watch("status") === "CONFIRMEE" && !isEdit && (
                <p className="text-sm text-muted-foreground mt-1">
                  Les missions CHECKIN, CHECKOUT et MENAGE seront créées automatiquement
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer la réservation"}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
