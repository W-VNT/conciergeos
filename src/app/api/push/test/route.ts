import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Check env vars
  const envCheck = {
    VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: !!process.env.VAPID_SUBJECT,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    PUSH_API_SECRET: !!process.env.PUSH_API_SECRET,
  };

  // Check subscriptions for this user (use service role to bypass RLS)
  const { createClient: createAdmin } = await import("@supabase/supabase-js");
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, created_at")
    .eq("user_id", user.id);

  // Try sending a test push
  let pushResult = "skipped";
  if (subscriptions && subscriptions.length > 0) {
    try {
      await sendPushToUser(user.id, {
        title: "Test ConciergeOS",
        body: "Les notifications push fonctionnent !",
        url: "/notifications",
      });
      pushResult = "sent";
    } catch (err) {
      pushResult = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return NextResponse.json({
    user_id: user.id,
    env: envCheck,
    subscriptions_count: subscriptions?.length ?? 0,
    subscriptions: subscriptions?.map((s) => ({
      id: s.id,
      endpoint: s.endpoint?.slice(0, 60) + "...",
      created_at: s.created_at,
    })),
    subscriptions_error: error?.message || null,
    push_result: pushResult,
  });
}
