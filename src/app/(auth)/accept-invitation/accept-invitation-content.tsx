"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Building2 } from "lucide-react";
import { verifyInvitationToken, acceptInvitation } from "@/lib/actions/team";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface InvitationData {
  id: string;
  email: string;
  role: "ADMIN" | "OPERATEUR";
  expires_at: string;
  organisation: {
    name: string;
  };
}

export function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        setError("Lien d'invitation invalide");
        setLoading(false);
        return;
      }

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Verify invitation token
      const result = await verifyInvitationToken(token);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // If user is not logged in, redirect directly to signup
      if (!user) {
        router.push(`/signup?invitation=${token}&email=${encodeURIComponent(result.invitation.email)}`);
        return;
      }

      setIsLoggedIn(true);
      setInvitation(result.invitation);
      setLoading(false);
    }

    loadInvitation();
  }, [token, supabase, router]);

  async function handleAccept() {
    if (!token || !invitation) return;

    setAccepting(true);

    // Check if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to signup with token in query params
      router.push(`/signup?invitation=${token}`);
      return;
    }

    // Accept the invitation
    const result = await acceptInvitation(token);

    if (result.error) {
      toast.error(result.error);
      setError(result.error);
      setAccepting(false);
      return;
    }

    toast.success("Invitation acceptée ! Bienvenue dans l'équipe.");
    router.push("/dashboard");
    router.refresh();
  }

  function handleSignup() {
    if (!token || !invitation) return;
    // Pass both token and email to signup page
    router.push(`/signup?invitation=${token}&email=${encodeURIComponent(invitation.email)}`);
  }

  function handleLogin() {
    if (!token || !invitation) return;
    // Pass token to login page to redirect back after login
    router.push(`/login?redirect=/accept-invitation?token=${encodeURIComponent(token)}`);
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Vérification de l'invitation...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
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
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Retour à la connexion
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
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
          <span className="font-semibold">{invitation.organisation.name}</span>
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

        {isLoggedIn ? (
          <>
            <Button
              onClick={handleAccept}
              className="w-full"
              disabled={accepting}
            >
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
              En acceptant, vous rejoignez {invitation.organisation.name} en
              tant que {invitation.role === "ADMIN" ? "administrateur" : "opérateur"}
            </p>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Button onClick={handleSignup} className="w-full">
                Créer un compte et accepter
              </Button>
              <Button
                onClick={handleLogin}
                variant="outline"
                className="w-full"
              >
                J'ai déjà un compte
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Vous devez créer un compte ou vous connecter avec l'email{" "}
              <span className="font-medium">{invitation.email}</span> pour
              accepter cette invitation
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
