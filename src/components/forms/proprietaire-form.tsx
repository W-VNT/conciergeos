"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Loader2, Sparkles } from "lucide-react";
import type { Proprietaire, StatutJuridique } from "@/types/database";
import { STATUT_JURIDIQUE_LABELS } from "@/types/database";

// Mapping code nature juridique INSEE → notre enum
function codeToStatutJuridique(code: string): StatutJuridique {
  const n = parseInt(code, 10);
  if (n >= 5200 && n <= 5299) return "SARL";
  if (n >= 5500 && n <= 5599) return "SARL";
  if (n >= 5700 && n <= 5799) return "SAS";
  if (n >= 6500 && n <= 6599) return "SCI";
  if (n >= 1000 && n <= 1999) return "EURL";
  return "AUTRE";
}

interface Props {
  proprietaire?: Proprietaire;
}

export function ProprietaireForm({ proprietaire }: Props) {
  const [loading, setLoading] = useState(false);
  const [siretLoading, setSiretLoading] = useState(false);
  const router = useRouter();
  const isEdit = !!proprietaire;

  const form = useForm<ProprietaireFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(proprietaireSchema) as any,
    defaultValues: {
      full_name: proprietaire?.full_name ?? "",
      phone: proprietaire?.phone ?? "",
      email: proprietaire?.email ?? "",
      address_line1: proprietaire?.address_line1 ?? "",
      postal_code: proprietaire?.postal_code ?? "",
      city: proprietaire?.city ?? "",
      statut_juridique: proprietaire?.statut_juridique ?? "PARTICULIER",
      siret: proprietaire?.siret ?? "",
      notes: proprietaire?.notes ?? "",
    },
  });
  useUnsavedChanges(form.formState.isDirty);

  const statutJuridique = form.watch("statut_juridique");
  const siretValue = form.watch("siret") ?? "";
  const canLookup = siretValue.replace(/\s/g, "").length === 9 || siretValue.replace(/\s/g, "").length === 14;

  async function lookupSiret() {
    const q = siretValue.replace(/\s/g, "");
    setSiretLoading(true);
    try {
      const res = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${q}&limite=1`
      );
      if (!res.ok) throw new Error("Erreur API");
      const data = await res.json();
      const result = data?.results?.[0];
      if (!result) {
        toast.error("Aucune entreprise trouvée pour ce SIRET/SIREN");
        return;
      }
      const siege = result.siege ?? {};
      form.setValue("full_name", result.nom_complet ?? form.getValues("full_name"));
      form.setValue("address_line1", siege.adresse ?? "");
      form.setValue("postal_code", siege.code_postal ?? "");
      form.setValue("city", siege.libelle_commune ?? "");
      if (result.nature_juridique) {
        form.setValue("statut_juridique", codeToStatutJuridique(result.nature_juridique));
      }
      toast.success("Informations importées depuis l'annuaire officiel");
    } catch {
      toast.error("Impossible de récupérer les informations");
    } finally {
      setSiretLoading(false);
    }
  }

  async function onSubmit(data: ProprietaireFormData) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updateProprietaire(proprietaire!.id, data)
        : await createProprietaire(data);

      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        setLoading(false);
        return;
      }

      toast.success(result.message ?? "Enregistré avec succès");
      router.push(isEdit ? `/proprietaires/${proprietaire!.id}` : "/proprietaires");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Identité ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Identité</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet *</Label>
                <Input id="full_name" {...form.register("full_name")} />
                {form.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Statut juridique</Label>
                <Controller name="statut_juridique" control={form.control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUT_JURIDIQUE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              {statutJuridique !== "PARTICULIER" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="siret">SIRET / SIREN</Label>
                  <div className="flex gap-2">
                    <Input
                      id="siret"
                      {...form.register("siret")}
                      placeholder="000 000 000 00000"
                      maxLength={14}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={lookupSiret}
                      disabled={!canLookup || siretLoading}
                      className="shrink-0"
                    >
                      {siretLoading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><Sparkles className="h-4 w-4 mr-1.5" />Compléter</>}
                    </Button>
                  </div>
                  {canLookup && (
                    <p className="text-xs text-muted-foreground">
                      Cliquez sur Compléter pour importer les informations depuis l'annuaire officiel
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Contact ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact</p>
            <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          {/* ── Adresse ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Adresse de facturation</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_line1">Adresse</Label>
                <Input id="address_line1" {...form.register("address_line1")} placeholder="12 rue de la Paix" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal</Label>
                <Input id="postal_code" {...form.register("postal_code")} placeholder="75001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" {...form.register("city")} placeholder="Paris" />
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
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
