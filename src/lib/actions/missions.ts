"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { missionSchema, type MissionFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMission(data: MissionFormData) {
  const profile = await requireProfile();
  const parsed = missionSchema.parse(data);
  const supabase = createClient();

  const { error } = await supabase.from("missions").insert({
    organisation_id: profile.organisation_id,
    logement_id: parsed.logement_id,
    assigned_to: parsed.assigned_to || null,
    type: parsed.type,
    status: parsed.status,
    priority: parsed.priority,
    scheduled_at: parsed.scheduled_at,
    time_spent_minutes: parsed.time_spent_minutes || null,
    notes: parsed.notes || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/missions");
  redirect("/missions");
}

export async function updateMission(id: string, data: MissionFormData) {
  const profile = await requireProfile();
  const parsed = missionSchema.parse(data);
  const supabase = createClient();

  const updateData: Record<string, unknown> = {
    logement_id: parsed.logement_id,
    assigned_to: parsed.assigned_to || null,
    type: parsed.type,
    status: parsed.status,
    priority: parsed.priority,
    scheduled_at: parsed.scheduled_at,
    time_spent_minutes: parsed.time_spent_minutes || null,
    notes: parsed.notes || null,
  };

  if (parsed.status === "TERMINE") {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("missions")
    .update(updateData)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/missions");
  redirect(`/missions/${id}`);
}

export async function completeMission(id: string) {
  await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("missions")
    .update({
      status: "TERMINE",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/missions");
  revalidatePath("/dashboard");
}

export async function deleteMission(id: string) {
  await requireProfile();
  const supabase = createClient();

  const { error } = await supabase.from("missions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/missions");
  redirect("/missions");
}
