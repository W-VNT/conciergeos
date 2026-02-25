import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";

export default async function ExportComptablePage() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/finances"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileSpreadsheet className="h-6 w-6" />Export comptable</h1>
          <p className="text-sm text-muted-foreground">Export au format FEC pour votre comptable</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Formats disponibles</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium">FEC (Fichier des Écritures Comptables)</h3>
            <p className="text-sm text-muted-foreground mt-1">Format standard français pour l&apos;export vers Pennylane, QuickBooks, Sage.</p>
            <p className="text-sm text-muted-foreground mt-1">Colonnes : Date, Logement, Voyageur, Plateforme, Montant HT, TVA, TTC, Commission, Net.</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium">CSV détaillé</h3>
            <p className="text-sm text-muted-foreground mt-1">Export détaillé de tous les revenus, factures prestataires et coûts d&apos;incidents.</p>
          </div>
          <p className="text-xs text-muted-foreground">Utilisez la page Fiscalité pour générer les exports avec les bons taux de TVA.</p>
        </CardContent>
      </Card>
    </div>
  );
}
