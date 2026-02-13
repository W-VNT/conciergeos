import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SERVICE_LEVEL_LABELS } from "@/types/database";
import { deleteProprietaire } from "@/lib/actions/proprietaires";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function ProprietaireDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const { data: proprietaire } = await supabase.from("proprietaires").select("*").eq("id", params.id).single();
  if (!proprietaire) notFound();

  const { data: logements } = await supabase.from("logements").select("id, name, status").eq("owner_id", proprietaire.id);

  return (
    <div className="space-y-6">
      <PageHeader title={proprietaire.full_name} showCreate={false}>
        {admin && (
          <>
            <Button variant="outline" asChild>
              <Link href={`/proprietaires/${proprietaire.id}/edit`}><Pencil className="h-4 w-4 mr-2" /> Modifier</Link>
            </Button>
            <form action={async () => { "use server"; await deleteProprietaire(proprietaire.id); }}>
              <Button variant="destructive" size="sm" type="submit"><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button>
            </form>
          </>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Téléphone</span><span>{proprietaire.phone || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{proprietaire.email || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Niveau</span><StatusBadge value={proprietaire.service_level} label={SERVICE_LEVEL_LABELS[proprietaire.service_level as keyof typeof SERVICE_LEVEL_LABELS]} /></div>
            {proprietaire.notes && <div><span className="text-muted-foreground">Notes</span><p className="mt-1 text-sm">{proprietaire.notes}</p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Logements ({logements?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {logements && logements.length > 0 ? (
              <div className="space-y-2">
                {logements.map((l) => (
                  <Link key={l.id} href={`/logements/${l.id}`} className="block p-2 rounded border hover:bg-gray-50">{l.name}</Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun logement</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
