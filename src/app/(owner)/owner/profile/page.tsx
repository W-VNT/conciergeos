import { getOwnerProfile } from "@/lib/actions/owner-portal";
import { OwnerProfileForm } from "@/components/owner/owner-profile-form";

export default async function OwnerProfilePage() {
  const proprietaire = await getOwnerProfile();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos informations personnelles
        </p>
      </div>

      <OwnerProfileForm proprietaire={proprietaire} />
    </div>
  );
}
