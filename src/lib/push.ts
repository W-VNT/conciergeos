import webpush from "web-push";
import { createClient as createServerClient } from "@supabase/supabase-js";

if (
  process.env.VAPID_SUBJECT &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PRIVATE_KEY) return;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  // Use service role key to bypass RLS (called from webhook without user session)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions?.length) return;

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
    )
  );

  // Clean up expired subscriptions (410 Gone)
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (
      result.status === "rejected" &&
      (result.reason as { statusCode?: number })?.statusCode === 410
    ) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", subscriptions[i].endpoint);
    }
  }
}
