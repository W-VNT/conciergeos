import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push";

export async function POST(request: NextRequest) {
  // Authenticate via shared secret (for Supabase webhook or internal calls)
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.PUSH_API_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Support Supabase webhook format (record object) or direct format
  const record = body.record || body;
  const userId = record.user_id;
  const title = record.title;
  const message = record.message || record.body;
  const entityType = record.entity_type;
  const entityId = record.entity_id;

  if (!userId || !title) {
    return NextResponse.json(
      { error: "Missing user_id or title" },
      { status: 400 }
    );
  }

  // Build deep link URL based on entity
  let url = "/notifications";
  if (entityType && entityId) {
    const routes: Record<string, string> = {
      MISSION: "/missions",
      INCIDENT: "/incidents",
      CONTRAT: "/contrats",
      LOGEMENT: "/logements",
    };
    if (routes[entityType]) {
      url = `${routes[entityType]}/${entityId}`;
    }
  }

  try {
    await sendPushToUser(userId, { title, body: message || "", url });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/send] Error:", err);
    return NextResponse.json(
      { error: "Failed to send push" },
      { status: 500 }
    );
  }
}
