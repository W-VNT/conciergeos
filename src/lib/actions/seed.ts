"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Seeds demo data for the current user's organisation
 * This will delete existing demo data and create fresh data
 */
export async function seedDemoData() {
  const supabase = createClient();

  try {
    // Call the database function that seeds data for current user's org
    const { data, error } = await supabase.rpc("seed_demo_data_for_current_user");

    if (error) {
      console.error("Seed error:", error);
      throw new Error(error.message || "Failed to seed demo data");
    }

    return { success: true, message: data };
  } catch (error) {
    console.error("Seed error:", error);
    throw error instanceof Error ? error : new Error("Failed to seed demo data");
  }
}
