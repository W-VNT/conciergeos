import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // Authenticate via CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const dayOfMonth = now.getDate();

  // Fetch all active recurrences
  const { data: recurrences, error: fetchError } = await supabase
    .from("mission_recurrences")
    .select("*")
    .eq("active", true);

  if (fetchError) {
    return NextResponse.json(
      { error: fetchError.message },
      { status: 500 }
    );
  }

  if (!recurrences || recurrences.length === 0) {
    return NextResponse.json({ success: true, generated: 0 });
  }

  let generated = 0;

  for (const recurrence of recurrences) {
    // Check if already generated today
    if (
      recurrence.last_generated_at &&
      recurrence.last_generated_at.startsWith(todayStr)
    ) {
      continue;
    }

    // Check if today matches the schedule
    let shouldGenerate = false;

    switch (recurrence.frequency) {
      case "HEBDOMADAIRE":
        // Weekly: check day_of_week
        shouldGenerate = recurrence.day_of_week === dayOfWeek;
        break;

      case "BIMENSUEL": {
        // Bi-weekly: generate every 14 days from last generation
        if (!recurrence.last_generated_at) {
          shouldGenerate = true;
        } else {
          const lastGenerated = new Date(recurrence.last_generated_at);
          const daysSinceLastGeneration = Math.floor(
            (now.getTime() - lastGenerated.getTime()) / (1000 * 60 * 60 * 24)
          );
          shouldGenerate = daysSinceLastGeneration >= 14;
        }
        break;
      }

      case "MENSUEL":
        // Monthly: check day_of_month
        shouldGenerate = recurrence.day_of_month === dayOfMonth;
        break;
    }

    if (!shouldGenerate) continue;

    // Create the mission
    const scheduledAt = `${todayStr}T${recurrence.scheduled_time}:00`;

    const { error: insertError } = await supabase.from("missions").insert({
      organisation_id: recurrence.organisation_id,
      logement_id: recurrence.logement_id,
      type: recurrence.type,
      status: "A_FAIRE",
      priority: recurrence.priority,
      scheduled_at: scheduledAt,
      assigned_to: recurrence.assigned_to,
      notes: recurrence.notes
        ? `[Récurrence auto] ${recurrence.notes}`
        : "[Récurrence auto]",
    });

    if (insertError) {
      console.error(
        `Failed to generate mission for recurrence ${recurrence.id}:`,
        insertError
      );
      continue;
    }

    // Update last_generated_at
    await supabase
      .from("mission_recurrences")
      .update({ last_generated_at: now.toISOString() })
      .eq("id", recurrence.id);

    generated++;
  }

  return NextResponse.json({ success: true, generated });
}
