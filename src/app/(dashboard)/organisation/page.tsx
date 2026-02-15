import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import TeamSettings from "@/components/settings/team-settings";
import OrganisationSettings from "@/components/settings/organisation-settings";
import { getCurrentOrganisation } from "@/lib/actions/organisation";

export default async function OrganisationPage() {
  const profile = await requireProfile();

  // Only admins can access this page
  if (profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const organisation = await getCurrentOrganisation();

  if (!organisation) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Organisation</h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre organisation et votre équipe
        </p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="organisation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="organisation">Organisation</TabsTrigger>
            <TabsTrigger value="team">Équipe</TabsTrigger>
          </TabsList>

          <TabsContent value="organisation" className="mt-6">
            <OrganisationSettings organisation={organisation} />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <TeamSettings profile={profile} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
