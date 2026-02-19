import { requireProfile, isProprietaire } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OwnerTopbar } from "@/components/owner/owner-topbar";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  if (!isProprietaire(profile)) redirect("/dashboard");

  const supabase = createClient();
  const { data: organisation } = await supabase
    .from("organisations")
    .select("name")
    .eq("id", profile.organisation_id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <OwnerTopbar
        profile={profile}
        organisationName={organisation?.name ?? "Ma Conciergerie"}
      />
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
