"use client";

import { useState } from "react";
import { updateOwnerProfile } from "@/lib/actions/owner-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import type { Proprietaire } from "@/types/database";

interface OwnerProfileFormProps {
  proprietaire: Proprietaire;
}

export function OwnerProfileForm({ proprietaire }: OwnerProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: proprietaire.full_name ?? "",
    phone: proprietaire.phone ?? "",
    email: proprietaire.email ?? "",
    address_line1: proprietaire.address_line1 ?? "",
    postal_code: proprietaire.postal_code ?? "",
    city: proprietaire.city ?? "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }

    setLoading(true);
    try {
      const result = await updateOwnerProfile(form);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error ?? "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet *</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="jean@exemple.fr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line1">Adresse</Label>
            <Input
              id="address_line1"
              value={form.address_line1}
              onChange={(e) => handleChange("address_line1", e.target.value)}
              placeholder="12 rue de la Paix"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal</Label>
              <Input
                id="postal_code"
                value={form.postal_code}
                onChange={(e) => handleChange("postal_code", e.target.value)}
                placeholder="75001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Paris"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
