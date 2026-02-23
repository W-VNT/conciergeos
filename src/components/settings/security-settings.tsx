"use client";

import { useState } from "react";
import { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { updatePassword, deleteAccount } from "@/lib/actions/auth";
import { Eye, EyeOff, AlertTriangle, Trash2 } from "lucide-react";

interface SecuritySettingsProps {
  profile: Profile;
}

export default function SecuritySettings({ profile }: SecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isAdmin = profile.role === "ADMIN";

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount(confirmationEmail);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setDeleting(false);
    }
  }

  function getPasswordStrength(password: string): {
    level: number;
    label: string;
    color: string;
  } {
    if (password.length === 0) return { level: 0, label: "", color: "" };
    if (password.length < 6)
      return { level: 0, label: "Trop court", color: "bg-red-500" };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1)
      return { level: 1, label: "Faible", color: "bg-orange-500" };
    if (strength === 2)
      return { level: 2, label: "Moyen", color: "bg-yellow-500" };
    if (strength === 3)
      return { level: 3, label: "Bon", color: "bg-blue-500" };
    return { level: 4, label: "Fort", color: "bg-green-500" };
  }

  const strength = getPasswordStrength(newPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(currentPassword, newPassword);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Mot de passe mis à jour avec succès");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Changer le mot de passe</h2>
        <p className="text-sm text-muted-foreground">
          Assurez-vous d'utiliser un mot de passe fort et unique
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Mot de passe actuel</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 -m-2 text-muted-foreground hover:text-foreground"
              aria-label={showCurrent ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 -m-2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Password strength indicator */}
          {newPassword && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full ${
                      level <= strength.level ? strength.color : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{strength.label}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 -m-2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
        </Button>
      </form>

      {/* Danger Zone */}
      <div className="border-t border-destructive/30 pt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-destructive mb-2">
              Zone de danger
            </h2>
            {isAdmin ? (
              <p className="text-sm text-muted-foreground mb-4">
                En tant qu&apos;administrateur, vous devez d&apos;abord transférer le rôle
                admin ou supprimer l&apos;organisation avant de pouvoir supprimer votre
                compte.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  La suppression de votre compte est{" "}
                  <strong>irréversible</strong>. Toutes vos données personnelles
                  seront définitivement supprimées.
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                  <li>Votre profil et informations personnelles</li>
                  <li>Vos missions assignées seront désassignées</li>
                  <li>Votre accès à l&apos;organisation sera révoqué</li>
                </ul>
              </>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isAdmin}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer mon compte
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Supprimer mon compte
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <span className="block font-semibold">
                Cette action est irréversible et supprimera définitivement :
              </span>
              <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
                <li>Votre profil et données personnelles</li>
                <li>Votre accès à l&apos;organisation</li>
                <li>Vos missions assignées seront désassignées</li>
              </ul>
              <span className="block text-sm font-medium pt-2">
                Pour confirmer, tapez votre email :{" "}
                <span className="font-bold text-foreground">
                  {profile.email}
                </span>
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={profile.email || ""}
              value={confirmationEmail}
              onChange={(e) => setConfirmationEmail(e.target.value)}
              autoComplete="off"
              className="border-destructive/50 focus-visible:ring-destructive"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setConfirmationEmail("");
              }}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmationEmail.toLowerCase() !== (profile.email || "").toLowerCase() || deleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
