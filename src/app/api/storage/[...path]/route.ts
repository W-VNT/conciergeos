import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const storagePath = params.path.join("/");

  // Block path traversal attempts
  if (params.path.some((seg) => seg === ".." || seg === ".")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the file belongs to the user's organisation
  // Storage path format: {organisationId}/{entityType}/{entityId}/{filename}
  const orgIdFromPath = params.path[0];
  if (orgIdFromPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.organisation_id !== orgIdFromPath) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data, error } = await supabase.storage
    .from("attachments")
    .download(storagePath);

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", data.type || "image/jpeg");
  headers.set("Cache-Control", "private, max-age=3600");

  return new NextResponse(data, { headers });
}
