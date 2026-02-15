import { requireProfile } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ProfileSettings from "@/components/settings/profile-settings";
import SecuritySettings from "@/components/settings/security-settings";
import TeamSettings from "@/components/settings/team-settings";
import OrganisationSettings from "@/components/settings/organisation-settings";
import { getCurrentOrganisation } from "@/lib/actions/organisation";

export default async function SettingsPage() {
  const profile = await requireProfile();
  const isAdmin = profile.role === "ADMIN";
  const organisation = await getCurrentOrganisation();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre profil, votre sécurité et votre équipe
        </p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? "grid-cols-4" : "grid-cols-2"}`}>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            {isAdmin && <TabsTrigger value="organisation">Organisation</TabsTrigger>}
            {isAdmin && <TabsTrigger value="team">Équipe</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileSettings profile={profile} />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecuritySettings />
          </TabsContent>

          {isAdmin && organisation && (
            <TabsContent value="organisation" className="mt-6">
              <OrganisationSettings organisation={organisation} />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="team" className="mt-6">
              <TeamSettings profile={profile} />
            </TabsContent>
          )}
        </Tabs>
      </Card>
    </div>
  );
}
