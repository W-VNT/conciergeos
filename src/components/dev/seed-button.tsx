"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { seedDemoData } from "@/lib/actions/seed";
import { toast } from "sonner";
import { Database } from "lucide-react";

export default function SeedButton() {
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    if (!confirm("Cela va supprimer toutes les données de démonstration existantes et en créer de nouvelles. Continuer ?")) {
      return;
    }

    setLoading(true);
    try {
      const result = await seedDemoData();
      toast.success(result.message || "Données de démonstration créées avec succès");
      // Reload the page to show new data
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création des données");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleSeed}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Database className="h-4 w-4" />
      {loading ? "Création en cours..." : "Générer données démo"}
    </Button>
  );
}
