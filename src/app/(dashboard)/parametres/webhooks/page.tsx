import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { getWebhookEndpoints } from "@/lib/actions/webhooks";
import { PageHeader } from "@/components/shared/page-header";
import { redirect } from "next/navigation";
import { WebhooksClient } from "@/components/webhooks/webhooks-client";

export const metadata = { title: "Webhooks" };
export const dynamic = "force-dynamic";

export default async function WebhooksPage() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/dashboard");

  const endpoints = await getWebhookEndpoints();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Webhooks"
        description="Recevez des notifications en temps réel via des appels HTTP"
        showCreate={false}
        showBack
        backHref="/organisation"
        entityName="Webhooks"
      />

      <WebhooksClient initialEndpoints={endpoints} />
    </div>
  );
}
