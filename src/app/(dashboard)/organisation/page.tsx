import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import TeamSettings from "@/components/settings/team-settings";
import OrganisationSettings from "@/components/settings/organisation-settings";
import OfferSettings from "@/components/settings/offer-settings";
import { getCurrentOrganisation } from "@/lib/actions/organisation";
import { getOfferConfigs } from "@/lib/actions/offers";

export default async function OrganisationPage() {
  const profile = await requireProfile();

  if (profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [organisation, offerConfigsResult] = await Promise.all([
    getCurrentOrganisation(),
    getOfferConfigs(),
  ]);

  if (!organisation) {
    redirect("/dashboard");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Organisation</h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre organisation et votre équipe
        </p>
      </div>

      <Tabs defaultValue="organisation" className="w-full">
        <Card className="p-2 mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="organisation">Organisation</TabsTrigger>
            <TabsTrigger value="offres">Offres</TabsTrigger>
            <TabsTrigger value="team">Équipe</TabsTrigger>
          </TabsList>
        </Card>

        <TabsContent value="organisation">
          <Card className="p-6">
            <OrganisationSettings organisation={organisation} />
          </Card>
        </TabsContent>

        <TabsContent value="offres">
          <Card className="p-6">
            <OfferSettings initialConfigs={offerConfigsResult.configs ?? []} />
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="p-6">
            <TeamSettings profile={profile} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
