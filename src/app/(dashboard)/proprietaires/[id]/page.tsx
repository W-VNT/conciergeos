import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { STATUT_JURIDIQUE_LABELS } from "@/types/database";
import { deleteProprietaire } from "@/lib/actions/proprietaires";
import { InviteProprietaireButton } from "@/components/proprietaires/invite-proprietaire-button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { formatPhone } from "@/lib/utils";
import { getProprietaireFinances } from "@/lib/actions/owner-analytics";
import { formatCurrency } from "@/lib/format-currency";
import { AdminOwnerMessages } from "@/components/owner/admin-owner-messages";
import { getAdminOwnerMessages } from "@/lib/actions/owner-portal";
import { PaymentsSection } from "@/components/proprietaires/payments-section";
import { ProprietaireDocumentsSection } from "@/components/proprietaires/documents-section";

export default async function ProprietaireDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const { data: proprietaire } = await supabase.from("proprietaires").select("*").eq("id", params.id).eq("organisation_id", profile.organisation_id).single();
  if (!proprietaire) notFound();

  const { data: logements } = await supabase.from("logements").select("id, name, status").eq("owner_id", proprietaire.id);

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("proprietaire_id", proprietaire.id)
    .maybeSingle();

  // Fetch pending or expired invitations so we can offer resend
  const { data: existingInvitation } = await supabase
    .from("invitations")
    .select("id, status, expires_at")
    .eq("proprietaire_id", proprietaire.id)
    .in("status", ["PENDING", "EXPIRED"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let invitationStatus: "connected" | "pending" | "expired" | "none" = "none";
  if (existingProfile) {
    invitationStatus = "connected";
  } else if (existingInvitation) {
    // Check if a PENDING invitation has actually expired
    const isExpired =
      existingInvitation.status === "EXPIRED" ||
      (existingInvitation.expires_at && new Date(existingInvitation.expires_at) < new Date());
    invitationStatus = isExpired ? "expired" : "pending";
  }

  // Fetch finance summary for this proprietaire
  const finances = await getProprietaireFinances(proprietaire.id, profile.organisation_id);
  const fmtEur = formatCurrency;

  // Fetch messages for this proprietaire
  const ownerMessages = await getAdminOwnerMessages(proprietaire.id).catch(() => []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={proprietaire.full_name}
        showCreate={false}
        showBack={true}
        backHref="/proprietaires"
        entityName={proprietaire.full_name}
      >
        {admin && (
          <>
            {proprietaire.email && (
              <InviteProprietaireButton
                proprietaireId={proprietaire.id}
                email={proprietaire.email}
                name={proprietaire.full_name}
                status={invitationStatus}
                invitationId={existingInvitation?.id}
              />
            )}
            <Button variant="outline" asChild>
              <Link href={`/proprietaires/${proprietaire.id}/edit`}><Pencil className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Modifier</span></Link>
            </Button>
            <DeleteConfirmDialog
              entityType="propriétaire"
              entityName={proprietaire.full_name}
              deleteAction={async () => {
                "use server";
                return await deleteProprietaire(proprietaire.id);
              }}
              redirectPath="/proprietaires"
            />
          </>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Identité</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Statut juridique</span><StatusBadge value={proprietaire.statut_juridique} label={STATUT_JURIDIQUE_LABELS[proprietaire.statut_juridique as keyof typeof STATUT_JURIDIQUE_LABELS]} /></div>
            {proprietaire.siret && <div className="flex justify-between"><span className="text-muted-foreground">SIRET</span><code className="bg-muted px-1.5 py-0.5 rounded text-xs">{proprietaire.siret}</code></div>}
            {proprietaire.notes && <div><span className="text-muted-foreground">Notes</span><p className="mt-1 text-sm">{proprietaire.notes}</p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Téléphone</span>{proprietaire.phone ? <a href={`tel:${proprietaire.phone}`} className="text-primary hover:underline">{formatPhone(proprietaire.phone)}</a> : <span>—</span>}</div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span>{proprietaire.email ? <a href={`mailto:${proprietaire.email}`} className="text-primary hover:underline">{proprietaire.email}</a> : <span>—</span>}</div>
            {(proprietaire.address_line1 || proprietaire.city) && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Adresse</span>
                <span className="text-right">{[proprietaire.address_line1, proprietaire.postal_code, proprietaire.city].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Logements ({logements?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {logements && logements.length > 0 ? (
              <div className="space-y-2">
                {logements.map((l) => (
                  <Link key={l.id} href={`/logements/${l.id}`} className="block p-2 rounded border hover:bg-muted/50 text-sm">{l.name}</Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun logement</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Finances */}
      <Card>
        <CardHeader>
          <CardTitle>Finances</CardTitle>
        </CardHeader>
        <CardContent>
          {finances.nb_reservations === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun revenu enregistré</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">CA Brut</p>
                <p className="text-lg font-semibold">{fmtEur(finances.total_ca_brut)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Commissions</p>
                <p className="text-lg font-semibold">{fmtEur(finances.total_commissions)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Net propriétaire</p>
                <p className="text-lg font-semibold text-green-600">{fmtEur(finances.total_net)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Réservations</p>
                <p className="text-lg font-semibold">{finances.nb_reservations}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <ProprietaireDocumentsSection proprietaireId={proprietaire.id} />

      {/* Paiements */}
      <PaymentsSection proprietaireId={proprietaire.id} />

      {/* Messages */}
      <AdminOwnerMessages
        proprietaireId={proprietaire.id}
        organisationId={profile.organisation_id}
        initialMessages={ownerMessages}
      />
    </div>
  );
}
