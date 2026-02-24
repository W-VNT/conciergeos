import { getOwnerMessages, getOwnerProfile } from "@/lib/actions/owner-portal";
import { OwnerMessages } from "@/components/owner/owner-messages";

export default async function OwnerMessagesPage() {
  const [messages, proprietaire] = await Promise.all([
    getOwnerMessages(),
    getOwnerProfile(),
  ]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Echangez avec l'administration de votre conciergerie
        </p>
      </div>

      <OwnerMessages messages={messages} proprietaireId={proprietaire.id} />
    </div>
  );
}
