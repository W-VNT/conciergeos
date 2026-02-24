"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { voyageurSchema, type VoyageurFormData } from "@/lib/schemas";
import { updateVoyageur } from "@/lib/actions/voyageurs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/shared/form-error";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Voyageur } from "@/types/database";

interface Props {
  voyageur: Voyageur;
}

export function VoyageurEditDialog({ voyageur }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<VoyageurFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(voyageurSchema) as any,
    defaultValues: {
      full_name: voyageur.full_name,
      email: voyageur.email ?? "",
      phone: voyageur.phone ?? "",
      language: voyageur.language ?? "",
      nationality: voyageur.nationality ?? "",
      notes: voyageur.notes ?? "",
      tags: voyageur.tags ?? [],
    },
  });

  function onSubmit(data: VoyageurFormData) {
    startTransition(async () => {
      try {
        const result = await updateVoyageur(voyageur.id, data);
        if (!result.success) {
          toast.error(result.error ?? "Erreur");
          return;
        }
        toast.success(result.message ?? "Voyageur mis à jour");
        setOpen(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Erreur");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Modifier</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Modifier le voyageur</SheetTitle>
          <SheetDescription>
            Modifiez les informations de {voyageur.full_name}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div>
            <Label htmlFor="edit_full_name">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input id="edit_full_name" {...form.register("full_name")} />
            {form.formState.errors.full_name && (
              <FormError message={form.formState.errors.full_name.message} />
            )}
          </div>

          <div>
            <Label htmlFor="edit_email">Email</Label>
            <Input id="edit_email" type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <FormError message={form.formState.errors.email.message} />
            )}
          </div>

          <div>
            <Label htmlFor="edit_phone">Téléphone</Label>
            <Input id="edit_phone" type="tel" {...form.register("phone")} />
          </div>

          <div>
            <Label htmlFor="edit_language">Langue</Label>
            <Input id="edit_language" placeholder="fr, en, es..." {...form.register("language")} />
          </div>

          <div>
            <Label htmlFor="edit_nationality">Nationalité</Label>
            <Input id="edit_nationality" {...form.register("nationality")} />
          </div>

          <div>
            <Label htmlFor="edit_tags">Tags (séparés par des virgules)</Label>
            <Input
              id="edit_tags"
              defaultValue={(voyageur.tags ?? []).join(", ")}
              onChange={(e) => {
                const tags = e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean);
                form.setValue("tags", tags);
              }}
            />
          </div>

          <div>
            <Label htmlFor="edit_notes">Notes</Label>
            <Textarea id="edit_notes" rows={3} {...form.register("notes")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
