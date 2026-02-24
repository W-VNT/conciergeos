"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { prestataireSchema, type PrestataireFormData } from "@/lib/schemas";
import { createPrestataire, updatePrestataire } from "@/lib/actions/prestataires";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/shared/form-error";
import { useState } from "react";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Loader2, Sparkles } from "lucide-react";
import type { Prestataire, StatutJuridique } from "@/types/database";
import { SPECIALTY_LABELS, STATUT_JURIDIQUE_LABELS } from "@/types/database";

function codeToStatutJuridique(code: string): StatutJuridique {
  const n = parseInt(code, 10);
  if (n >= 5200 && n <= 5299) return "SARL";
  if (n >= 5500 && n <= 5599) return "SARL";
  if (n >= 5700 && n <= 5799) return "SAS";
  if (n >= 6500 && n <= 6599) return "SCI";
  if (n >= 1000 && n <= 1999) return "EURL";
  return "AUTRE";
}

export function PrestataireForm({ prestataire }: { prestataire?: Prestataire }) {
  const [loading, setLoading] = useState(false);
  const [siretLoading, setSiretLoading] = useState(false);
  const router = useRouter();
  const isEdit = !!prestataire;

  const form = useForm<PrestataireFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(prestataireSchema) as any,
    defaultValues: {
      full_name: prestataire?.full_name ?? "",
      specialty: prestataire?.specialty ?? "AUTRE",
      statut_juridique: prestataire?.statut_juridique ?? "AUTRE",
      siret: prestataire?.siret ?? "",
      phone: prestataire?.phone ?? "",
      email: prestataire?.email ?? "",
      address_line1: prestataire?.address_line1 ?? "",
      postal_code: prestataire?.postal_code ?? "",
      city: prestataire?.city ?? "",
      zone: prestataire?.zone ?? "",
      hourly_rate: prestataire?.hourly_rate ?? null,
      reliability_score: prestataire?.reliability_score ?? null,
      notes: prestataire?.notes ?? "",
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

  async function onSubmit(data: PrestataireFormData) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updatePrestataire(prestataire!.id, data)
        : await createPrestataire(data);

      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        setLoading(false);
        return;
      }

      toast.success(result.message ?? "Enregistré avec succès");
      router.push(isEdit ? `/prestataires/${prestataire!.id}` : "/prestataires");
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
                {form.formState.errors.full_name && <FormError message={form.formState.errors.full_name.message} />}
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
                      Cliquez sur Compléter pour importer les informations depuis l&apos;annuaire officiel
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
                <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" {...form.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" inputMode="email" autoComplete="email" {...form.register("email")} />
              </div>
            </div>
          </div>

          {/* ── Adresse de facturation ── */}
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

          {/* ── Prestation ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Prestation</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Spécialité</Label>
                <Controller name="specialty" control={form.control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(SPECIALTY_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone">Zone d&apos;intervention</Label>
                <Input id="zone" {...form.register("zone")} placeholder="Ex: Paris 1-5, Banlieue sud" />
              </div>
              <div className="space-y-2"><Label htmlFor="hourly_rate">Taux horaire (EUR)</Label><Input id="hourly_rate" type="number" step="0.01" {...form.register("hourly_rate")} /></div>
              <div className="space-y-2"><Label htmlFor="reliability_score">Fiabilité (1-5)</Label><Input id="reliability_score" type="number" min="1" max="5" {...form.register("reliability_score")} /></div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>

          <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
