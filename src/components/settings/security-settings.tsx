"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updatePassword } from "@/lib/actions/auth";
import { Eye, EyeOff } from "lucide-react";

export default function SecuritySettings() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function getPasswordStrength(password: string): {
    level: number;
    label: string;
    color: string;
  } {
    if (password.length === 0) return { level: 0, label: "", color: "" };
    if (password.length < 6)
      return { level: 1, label: "Faible", color: "bg-red-500" };
    if (password.length < 8)
      return { level: 2, label: "Moyen", color: "bg-orange-500" };
    if (password.length < 12)
      return { level: 3, label: "Bon", color: "bg-yellow-500" };
    return { level: 4, label: "Excellent", color: "bg-green-500" };
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
      const result = await updatePassword(newPassword);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Mot de passe mis à jour avec succès");
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
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                      level <= strength.level ? strength.color : "bg-gray-200"
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
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
    </div>
  );
}
