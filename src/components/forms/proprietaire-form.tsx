"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { proprietaireSchema, type ProprietaireFormData } from "@/lib/schemas";
import { createProprietaire, updateProprietaire } from "@/lib/actions/proprietaires";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import type { Proprietaire } from "@/types/database";

interface Props {
  proprietaire?: Proprietaire;
}

export function ProprietaireForm({ proprietaire }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!proprietaire;

  const form = useForm<ProprietaireFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(proprietaireSchema) as any,
    defaultValues: {
      full_name: proprietaire?.full_name ?? "",
      phone: proprietaire?.phone ?? "",
      email: proprietaire?.email ?? "",
      service_level: proprietaire?.service_level ?? "STANDARD",
      notes: proprietaire?.notes ?? "",
    },
  });

  async function onSubmit(data: ProprietaireFormData) {
    setLoading(true);
    try {
      if (isEdit) {
        await updateProprietaire(proprietaire!.id, data);
      } else {
        await createProprietaire(data);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet *</Label>
              <Input id="full_name" {...form.register("full_name")} />
              {form.formState.errors.full_name && (
                <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_level">Niveau de service</Label>
              <Select
                defaultValue={form.getValues("service_level")}
                onValueChange={(v) => form.setValue("service_level", v as "STANDARD" | "VIP")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
