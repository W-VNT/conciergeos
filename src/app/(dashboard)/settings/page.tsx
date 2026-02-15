import { requireProfile } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ProfileSettings from "@/components/settings/profile-settings";
import SecuritySettings from "@/components/settings/security-settings";
import TeamSettings from "@/components/settings/team-settings";

export default async function SettingsPage() {
  const profile = await requireProfile();
  const isAdmin = profile.role === "ADMIN";

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            {isAdmin && <TabsTrigger value="team">Équipe</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileSettings profile={profile} />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecuritySettings />
          </TabsContent>

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
