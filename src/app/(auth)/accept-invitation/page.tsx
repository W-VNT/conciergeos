import { Suspense } from "react";
import { AcceptInvitationContent } from "./accept-invitation-content";

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Suspense fallback={<div className="text-center">Chargement...</div>}>
        <AcceptInvitationContent />
      </Suspense>
    </div>
  );
}
