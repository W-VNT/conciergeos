import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/types/database";

/**
 * Cron endpoint for email digests.
 *
 * - QUOTIDIEN: runs daily, finds users with email_digest='QUOTIDIEN',
 *   gets their unread notifications from the last 24 hours.
 * - HEBDOMADAIRE: runs weekly (only on Monday), gets unread from last 7 days.
 *
 * The endpoint creates a summary (count by type, top items) and logs it.
 * Actual email sending can be plugged in later via sendEmail().
 *
 * Secured with CRON_SECRET.
 */
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
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday

  const results = {
    daily: { processed: 0, users: 0 },
    weekly: { processed: 0, users: 0 },
  };

  // ---- QUOTIDIEN: process daily digest ----
  const twentyFourHoursAgo = new Date(
    now.getTime() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: dailyUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email_digest")
    .eq("email_digest", "QUOTIDIEN");

  if (dailyUsers && dailyUsers.length > 0) {
    results.daily.users = dailyUsers.length;

    for (const user of dailyUsers) {
      const { data: notifications } = await supabase
        .from("notifications")
        .select("id, type, title, message, created_at")
        .eq("user_id", user.id)
        .is("read_at", null)
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: false });

      if (!notifications || notifications.length === 0) continue;

      // Build summary by type
      const countByType: Record<string, number> = {};
      for (const n of notifications) {
        countByType[n.type] = (countByType[n.type] || 0) + 1;
      }

      const topItems = notifications.slice(0, 5).map((n) => ({
        title: n.title,
        message: n.message,
        type: n.type,
      }));

      const summary = {
        userId: user.id,
        userName: user.full_name,
        period: "daily",
        totalUnread: notifications.length,
        countByType,
        topItems,
        generatedAt: now.toISOString(),
      };

      // Log the digest summary (actual email sending to be added later)
      console.log(
        `[EMAIL-DIGEST] Daily digest for ${user.full_name} (${user.id}):`,
        JSON.stringify(summary, null, 2)
      );

      results.daily.processed++;
    }
  }

  // ---- HEBDOMADAIRE: process weekly digest (only on Monday) ----
  if (dayOfWeek === 1) {
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: weeklyUsers } = await supabase
      .from("profiles")
      .select("id, full_name, email_digest")
      .eq("email_digest", "HEBDOMADAIRE");

    if (weeklyUsers && weeklyUsers.length > 0) {
      results.weekly.users = weeklyUsers.length;

      for (const user of weeklyUsers) {
        const { data: notifications } = await supabase
          .from("notifications")
          .select("id, type, title, message, created_at")
          .eq("user_id", user.id)
          .is("read_at", null)
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false });

        if (!notifications || notifications.length === 0) continue;

        // Build summary by type
        const countByType: Record<string, number> = {};
        for (const n of notifications) {
          countByType[n.type] = (countByType[n.type] || 0) + 1;
        }

        // Group by day for weekly overview
        const countByDay: Record<string, number> = {};
        for (const n of notifications) {
          const day = n.created_at.split("T")[0];
          countByDay[day] = (countByDay[day] || 0) + 1;
        }

        const topItems = notifications.slice(0, 10).map((n) => ({
          title: n.title,
          message: n.message,
          type: n.type,
        }));

        const summary = {
          userId: user.id,
          userName: user.full_name,
          period: "weekly",
          totalUnread: notifications.length,
          countByType,
          countByDay,
          topItems,
          generatedAt: now.toISOString(),
        };

        // Log the digest summary (actual email sending to be added later)
        console.log(
          `[EMAIL-DIGEST] Weekly digest for ${user.full_name} (${user.id}):`,
          JSON.stringify(summary, null, 2)
        );

        results.weekly.processed++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
    isMonday: dayOfWeek === 1,
    timestamp: now.toISOString(),
  });
}
