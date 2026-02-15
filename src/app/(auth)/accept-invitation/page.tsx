"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Building2 } from "lucide-react";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        setError("Lien d'invitation invalide");
        setLoading(false);
        return;
      }

      // Get invitation by token
      const { data, error: fetchError } = await supabase
        .from("invitations")
        .select("*, organisations(name)")
        .eq("token", token)
        .eq("status", "PENDING")
        .single();

      if (fetchError || !data) {
        setError("Invitation non trouvée ou expirée");
        setLoading(false);
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError("Cette invitation a expiré");
        setLoading(false);
        return;
      }

      setInvitation(data);
      setLoading(false);
    }

    loadInvitation();
  }, [token, supabase]);

  async function handleAccept() {
    if (!token || !invitation) return;

    setAccepting(true);

    // Check if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to signup with token
      router.push(`/signup?invitation=${token}`);
      return;
    }

    // Check if user email matches invitation email
    if (user.email !== invitation.email) {
      setError(
        `Cette invitation est pour ${invitation.email}. Vous êtes connecté avec ${user.email}. Déconnectez-vous et créez un compte avec l'email invité.`
      );
      setAccepting(false);
      return;
    }

    // Check if user already has a profile
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existingProfile) {
      setError("Vous êtes déjà membre d'une organisation");
      setAccepting(false);
      return;
    }

    // Create profile for the user
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      organisation_id: invitation.organisation_id,
      full_name: user.email?.split("@")[0] || "Membre",
      role: invitation.role,
    });

    if (profileError) {
      setError("Erreur lors de l'acceptation de l'invitation");
      setAccepting(false);
      return;
    }

    // Update invitation status
    await supabase
      .from("invitations")
      .update({ status: "ACCEPTED", accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    // Redirect to dashboard
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Vérification de l'invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-7 w-7 text-destructive" />
              </div>
            </div>
            <CardTitle>Invitation invalide</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle>Invitation à rejoindre une équipe</CardTitle>
          <CardDescription>
            Vous avez été invité à rejoindre{" "}
            <span className="font-semibold">{invitation.organisations?.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rôle</span>
              <span className="font-medium">
                {invitation.role === "ADMIN" ? "Administrateur" : "Opérateur"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expire le</span>
              <span className="font-medium">
                {new Date(invitation.expires_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>

          <Button onClick={handleAccept} className="w-full" disabled={accepting}>
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Acceptation...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accepter l'invitation
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            En acceptant, vous rejoignez {invitation.organisations?.name} en tant que{" "}
            {invitation.role === "ADMIN" ? "administrateur" : "opérateur"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
