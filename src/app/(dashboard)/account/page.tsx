import { requireProfile } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ProfileSettings from "@/components/settings/profile-settings";
import SecuritySettings from "@/components/settings/security-settings";
import ApplicationSettings from "@/components/settings/application-settings";
import TwoFactorSetup from "@/components/settings/two-factor-setup";
import { get2FAStatus } from "@/lib/actions/two-factor";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const profile = await requireProfile();
  const twoFactorStatus = await get2FAStatus();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mon compte</h1>
        <p className="text-muted-foreground mt-2">
          Gerez vos informations personnelles et preferences
        </p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="security">Securite</TabsTrigger>
            <TabsTrigger value="application">Application</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileSettings profile={profile} />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecuritySettings profile={profile} />
            <Separator className="my-8" />
            <TwoFactorSetup initialEnabled={twoFactorStatus.enabled} />
          </TabsContent>

          <TabsContent value="application" className="mt-6">
            <ApplicationSettings />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
