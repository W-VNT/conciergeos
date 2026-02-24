import { requireProfile, isAdmin } from "@/lib/auth";
import { getEtatDesLieux } from "@/lib/actions/etats-des-lieux";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EdlDetailClient } from "@/components/etats-des-lieux/edl-detail-client";

export default async function EtatDesLieuxDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const edl = await getEtatDesLieux(params.id);
  if (!edl) notFound();

  const logement = edl.logement as { id: string; name: string } | null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`État des lieux — ${logement?.name ?? "—"}`}
        showCreate={false}
        showBack={true}
        backHref="/etats-des-lieux"
        entityName={logement?.name ?? "État des lieux"}
      />
      <EdlDetailClient
        edl={{
          id: edl.id,
          type: edl.type,
          status: edl.status,
          notes: edl.notes,
          guest_signature_url: edl.guest_signature_url,
          inspector_signature_url: edl.inspector_signature_url,
          completed_at: edl.completed_at,
          created_at: edl.created_at,
          logement: logement,
          reservation: edl.reservation as { id: string; guest_name: string } | null,
          inspector: edl.inspector as { id: string; full_name: string } | null,
          items: (edl.items ?? []).map((item: Record<string, unknown>) => ({
            id: item.id as string,
            room: item.room as string,
            element: item.element as string,
            condition: item.condition as string,
            photo_urls: (item.photo_urls as string[]) ?? [],
            notes: (item.notes as string) ?? null,
            position: (item.position as number) ?? 0,
          })),
        }}
        isAdmin={isAdmin(profile)}
      />
    </div>
  );
}
