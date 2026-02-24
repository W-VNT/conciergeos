"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { voyageurSchema, type VoyageurFormData } from "@/lib/schemas";
import { createVoyageur } from "@/lib/actions/voyageurs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/shared/form-error";
import { useState } from "react";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Loader2 } from "lucide-react";

export function VoyageurForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<VoyageurFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(voyageurSchema) as any,
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      language: "",
      nationality: "",
      notes: "",
      tags: [],
    },
  });
  useUnsavedChanges(form.formState.isDirty);

  async function onSubmit(data: VoyageurFormData) {
    setLoading(true);
    try {
      const result = await createVoyageur(data);
      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        setLoading(false);
        return;
      }
      toast.success(result.message ?? "Voyageur créé");
      router.push(`/voyageurs/${result.data?.id}`);
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
              <Label htmlFor="full_name">
                Nom complet <span className="text-destructive">*</span>
              </Label>
              <Input id="full_name" {...form.register("full_name")} />
              {form.formState.errors.full_name && (
                <FormError message={form.formState.errors.full_name.message} />
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" inputMode="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <FormError message={form.formState.errors.email.message} />
              )}
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" {...form.register("phone")} />
            </div>

            <div>
              <Label htmlFor="language">Langue</Label>
              <Input id="language" placeholder="fr, en, es..." {...form.register("language")} />
            </div>

            <div>
              <Label htmlFor="nationality">Nationalité</Label>
              <Input id="nationality" {...form.register("nationality")} />
            </div>

            <div>
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                placeholder="VIP, fidèle, professionnel..."
                onChange={(e) => {
                  const tags = e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  form.setValue("tags", tags);
                }}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 bg-background pt-3 pb-1 border-t md:static md:border-0 md:pt-0 md:pb-0">
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1 md:flex-none">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Enregistrement..." : "Créer le voyageur"}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex-1 md:flex-none">
            Annuler
          </Button>
        </div>
      </div>
    </form>
  );
}
