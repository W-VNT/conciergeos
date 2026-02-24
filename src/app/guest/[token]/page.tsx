import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Calendar, KeyRound, Wifi, MapPin, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portail Voyageur | ConciergeOS",
  description: "Informations pour votre séjour",
};

interface PortalData {
  reservation: {
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
    check_in_time: string | null;
    check_out_time: string | null;
    access_instructions: string | null;
  };
  logement: {
    name: string;
    address_line1: string | null;
    city: string | null;
    postal_code: string | null;
    lockbox_code: string | null;
    wifi_name: string | null;
    wifi_password: string | null;
  } | null;
}

async function getPortalData(
  token: string
): Promise<{ valid: boolean; expired?: boolean; data?: PortalData }> {
  const supabase = createClient();

  const { data: portalToken, error: tokenError } = await supabase
    .from("guest_portal_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (tokenError || !portalToken) {
    return { valid: false };
  }

  if (new Date(portalToken.expires_at) < new Date()) {
    return { valid: false, expired: true };
  }

  const { data: reservation, error: resError } = await supabase
    .from("reservations")
    .select(
      "guest_name, check_in_date, check_out_date, check_in_time, check_out_time, access_instructions, logement:logements(name, address_line1, city, postal_code, lockbox_code, wifi_name, wifi_password)"
    )
    .eq("id", portalToken.reservation_id)
    .single();

  if (resError || !reservation) {
    return { valid: false };
  }

  const logement = reservation.logement as unknown as PortalData["logement"];

  return {
    valid: true,
    data: {
      reservation: {
        guest_name: reservation.guest_name,
        check_in_date: reservation.check_in_date,
        check_out_date: reservation.check_out_date,
        check_in_time: reservation.check_in_time,
        check_out_time: reservation.check_out_time,
        access_instructions: reservation.access_instructions,
      },
      logement,
    },
  };
}

export default async function GuestPortalPage({
  params,
}: {
  params: { token: string };
}) {
  const result = await getPortalData(params.token);

  if (!result.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-xl font-semibold">
                {result.expired ? "Lien expiré" : "Lien invalide"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {result.expired
                  ? "Ce lien d'accès a expiré. Veuillez contacter votre hôte pour obtenir un nouveau lien."
                  : "Ce lien n'est pas valide. Veuillez vérifier l'URL ou contacter votre hôte."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { reservation, logement } = result.data!;
  const checkIn = new Date(reservation.check_in_date);
  const checkOut = new Date(reservation.check_out_date);
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                Bienvenue, {reservation.guest_name}
              </h1>
              {logement && (
                <p className="text-sm text-muted-foreground">
                  {logement.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Dates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Votre séjour
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-muted-foreground">Arrivée</p>
                <p className="font-semibold">
                  {checkIn.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {reservation.check_in_time && (
                  <Badge variant="secondary" className="text-xs">
                    {reservation.check_in_time}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Départ</p>
                <p className="font-semibold">
                  {checkOut.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {reservation.check_out_time && (
                  <Badge variant="secondary" className="text-xs">
                    {reservation.check_out_time}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-muted-foreground">
              {nights} nuit{nights > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Address */}
        {logement && (logement.address_line1 || logement.city) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Adresse
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{logement.name}</p>
              {logement.address_line1 && (
                <p className="text-muted-foreground">{logement.address_line1}</p>
              )}
              {(logement.postal_code || logement.city) && (
                <p className="text-muted-foreground">
                  {[logement.postal_code, logement.city].filter(Boolean).join(" ")}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Access Info: Lockbox */}
        {logement?.lockbox_code && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4" />
                Code d&apos;accès
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Code boîte à clés
                </p>
                <p className="text-3xl font-bold font-mono tracking-widest">
                  {logement.lockbox_code}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* WiFi */}
        {logement && (logement.wifi_name || logement.wifi_password) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wifi className="h-4 w-4" />
                WiFi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {logement.wifi_name && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Réseau</span>
                  <code className="bg-muted px-3 py-1 rounded font-mono">
                    {logement.wifi_name}
                  </code>
                </div>
              )}
              {logement.wifi_password && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Mot de passe</span>
                  <code className="bg-muted px-3 py-1 rounded font-mono">
                    {logement.wifi_password}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Access Instructions */}
        {reservation.access_instructions && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Instructions d&apos;accès
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {reservation.access_instructions}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Propulsé par ConciergeOS
          </p>
        </div>
      </div>
    </div>
  );
}
