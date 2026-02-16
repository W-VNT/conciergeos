import { requireProfile } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentOrganisation } from "@/lib/actions/organisation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const organisation = await getCurrentOrganisation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar profile={profile} organisation={organisation} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Topbar profile={profile} organisation={organisation} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
