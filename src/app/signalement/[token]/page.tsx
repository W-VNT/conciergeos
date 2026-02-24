import { getPublicLogementInfo } from "@/lib/actions/public-incidents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { SignalementForm } from "./signalement-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signaler un incident | ConciergeOS",
  description: "Signalez un problème dans votre logement",
};

export default async function SignalementPage({
  params,
}: {
  params: { token: string };
}) {
  const logementInfo = await getPublicLogementInfo(params.token);

  if (!logementInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-xl font-semibold">Lien invalide</h1>
              <p className="text-muted-foreground text-sm">
                Ce lien de signalement n&apos;est pas valide. Veuillez
                contacter votre h&ocirc;te pour obtenir un lien correct.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Signaler un incident</h1>
              <p className="text-sm text-muted-foreground">
                {logementInfo.logement_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <SignalementForm
          token={params.token}
          logementName={logementInfo.logement_name}
        />

        <div className="text-center py-4 mt-4">
          <p className="text-xs text-muted-foreground">
            Propuls&eacute; par ConciergeOS
          </p>
        </div>
      </div>
    </div>
  );
}
