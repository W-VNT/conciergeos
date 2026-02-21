import { requireProfile, isProprietaire } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentOrganisation } from "@/lib/actions/organisation";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  if (isProprietaire(profile)) redirect("/owner/dashboard");
  const organisation = await getCurrentOrganisation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar profile={profile} organisation={organisation} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <DashboardShell profile={profile} organisation={organisation}>
          {children}
        </DashboardShell>
      </div>
    </div>
  );
}
