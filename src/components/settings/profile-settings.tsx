"use client";

import { useState, useEffect } from "react";
import { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";
import AvatarUpload from "./avatar-upload";
import { USER_ROLE_LABELS } from "@/types/database";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface ProfileSettingsProps {
  profile: Profile;
}

export default function ProfileSettings({ profile }: ProfileSettingsProps) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone || "");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isEmailVerified = !!profile.email_confirmed_at;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleResendVerification() {
    if (!profile.email) return;
    setResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: profile.email,
      });
      if (error) {
        toast.error("Erreur lors de l'envoi de l'email");
      } else {
        toast.success("Email de vérification envoyé !");
        setResendCooldown(60);
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        full_name: fullName,
        phone: phone || undefined,
      });
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Photo de profil</h2>
        <AvatarUpload profile={profile} />
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Jean Dupont"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
            />
            <p className="text-sm text-muted-foreground">
              Format: +33 6 12 34 56 78 ou 06 12 34 56 78
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="email">Email</Label>
              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Vérifié
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Non vérifié
                </span>
              )}
            </div>
            <Input
              id="email"
              type="email"
              value={profile.email || ""}
              disabled
              className="bg-muted"
            />
            {!isEmailVerified && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={resending || resendCooldown > 0}
                className="gap-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
                {resendCooldown > 0
                  ? `Renvoyer (${resendCooldown}s)`
                  : resending
                    ? "Envoi..."
                    : "Renvoyer l'email de vérification"}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Input
              id="role"
              type="text"
              value={USER_ROLE_LABELS[profile.role]}
              disabled
              className="bg-muted"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </form>
      </div>
    </div>
  );
}
