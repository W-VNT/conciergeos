"use server";

import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { webhookEndpointSchema, type WebhookEndpointFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { WebhookEndpoint, WebhookDelivery } from "@/types/database";

export async function getWebhookEndpoints(): Promise<WebhookEndpoint[]> {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return [];
  const supabase = createClient();

  const { data } = await supabase
    .from("webhook_endpoints")
    .select("*")
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  return (data ?? []) as WebhookEndpoint[];
}

export async function createWebhookEndpoint(
  data: WebhookEndpointFormData
): Promise<ActionResponse<{ id: string; secret: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile))
      return errorResponse("Non autorisé") as ActionResponse<{ id: string; secret: string }>;

    const parsed = webhookEndpointSchema.parse(data);
    const supabase = createClient();

    const secret = crypto.randomBytes(32).toString("hex");

    const { data: created, error } = await supabase
      .from("webhook_endpoints")
      .insert({
        organisation_id: profile.organisation_id,
        url: parsed.url,
        secret,
        events: parsed.events,
        active: parsed.active,
        description: parsed.description || null,
      })
      .select("id")
      .single();

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string; secret: string }>;

    revalidatePath("/parametres/webhooks");
    return successResponse("Webhook créé avec succès", {
      id: created.id,
      secret,
    });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la création du webhook"
    ) as ActionResponse<{ id: string; secret: string }>;
  }
}

export async function updateWebhookEndpoint(
  id: string,
  data: Partial<WebhookEndpointFormData>
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");
    const supabase = createClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.url !== undefined) updateData.url = data.url;
    if (data.events !== undefined) updateData.events = data.events;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.description !== undefined)
      updateData.description = data.description || null;

    const { error } = await supabase
      .from("webhook_endpoints")
      .update(updateData)
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/parametres/webhooks");
    return successResponse("Webhook mis à jour");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour du webhook"
    );
  }
}

export async function deleteWebhookEndpoint(
  id: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");
    const supabase = createClient();

    const { error } = await supabase
      .from("webhook_endpoints")
      .delete()
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/parametres/webhooks");
    return successResponse("Webhook supprimé");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression du webhook"
    );
  }
}

export async function getWebhookDeliveries(
  webhookId: string
): Promise<WebhookDelivery[]> {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) return [];
  const supabase = createClient();

  // Verify webhook belongs to org
  const { data: webhook } = await supabase
    .from("webhook_endpoints")
    .select("id")
    .eq("id", webhookId)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (!webhook) return [];

  const { data } = await supabase
    .from("webhook_deliveries")
    .select("*")
    .eq("webhook_id", webhookId)
    .order("delivered_at", { ascending: false })
    .limit(50);

  return (data ?? []) as WebhookDelivery[];
}

export async function dispatchWebhook(
  orgId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createClient();

    // Find all active endpoints that subscribe to this event
    const { data: endpoints } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("organisation_id", orgId)
      .eq("active", true)
      .contains("events", [event]);

    if (!endpoints || endpoints.length === 0) return;

    const deliveries = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const body = JSON.stringify({
          event,
          payload,
          timestamp: new Date().toISOString(),
        });

        // Create HMAC signature
        const signature = crypto
          .createHmac("sha256", endpoint.secret)
          .update(body)
          .digest("hex");

        let statusCode: number | null = null;
        let responseBody: string | null = null;

        try {
          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": signature,
              "X-Webhook-Event": event,
            },
            body,
            signal: AbortSignal.timeout(10000), // 10s timeout
          });

          statusCode = response.status;
          responseBody = await response.text().catch(() => null);
        } catch (fetchError) {
          statusCode = 0;
          responseBody = (fetchError as Error).message;
        }

        // Record delivery
        await supabase.from("webhook_deliveries").insert({
          webhook_id: endpoint.id,
          event,
          payload,
          status_code: statusCode,
          response_body: responseBody?.slice(0, 2000) ?? null,
          delivered_at: new Date().toISOString(),
        });
      })
    );
  } catch (err) {
    console.error("[webhooks] dispatchWebhook error:", err);
  }
}
