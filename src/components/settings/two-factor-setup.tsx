"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  setup2FA,
  enable2FA,
  disable2FA,
  regenerateBackupCodes,
} from "@/lib/actions/two-factor";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  RefreshCw,
  Loader2,
  Key,
} from "lucide-react";

interface TwoFactorSetupProps {
  initialEnabled: boolean;
}

type SetupStep = "idle" | "show-secret" | "verify" | "show-backup";

export default function TwoFactorSetup({
  initialEnabled,
}: TwoFactorSetupProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<SetupStep>("idle");
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState("");
  const [formattedSecret, setFormattedSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function handleSetup() {
    setLoading(true);
    try {
      const result = await setup2FA();
      if (result.success && result.data) {
        setSecret(result.data.secret);
        setFormattedSecret(result.data.formattedSecret);
        setBackupCodes(result.data.backupCodes);
        setStep("show-secret");
      } else {
        toast.error(result.error || "Erreur lors de la configuration");
      }
    } catch {
      toast.error("Erreur lors de la configuration 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (verificationCode.length !== 6) {
      toast.error("Le code doit contenir 6 chiffres");
      return;
    }

    setLoading(true);
    try {
      const result = await enable2FA(verificationCode);
      if (result.success && result.data) {
        setBackupCodes(result.data.backupCodes);
        setEnabled(true);
        setStep("show-backup");
        toast.success("2FA activee avec succes");
      } else {
        toast.error(result.error || "Code invalide");
      }
    } catch {
      toast.error("Erreur lors de la verification");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    try {
      const result = await disable2FA();
      if (result.success) {
        setEnabled(false);
        setStep("idle");
        setSecret("");
        setFormattedSecret("");
        setBackupCodes([]);
        setVerificationCode("");
        setDisableDialogOpen(false);
        toast.success("2FA desactivee");
      } else {
        toast.error(result.error || "Erreur lors de la desactivation");
      }
    } catch {
      toast.error("Erreur lors de la desactivation 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerateCodes() {
    setRegenerating(true);
    try {
      const result = await regenerateBackupCodes();
      if (result.success && result.data) {
        setBackupCodes(result.data.backupCodes);
        toast.success("Codes de secours regeneres");
      } else {
        toast.error(result.error || "Erreur lors de la regeneration");
      }
    } catch {
      toast.error("Erreur lors de la regeneration des codes");
    } finally {
      setRegenerating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copie dans le presse-papiers");
    });
  }

  function handleCancel() {
    setStep("idle");
    setSecret("");
    setFormattedSecret("");
    setVerificationCode("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold">
            Authentification a deux facteurs (2FA)
          </h3>
          <p className="text-sm text-muted-foreground">
            Ajoutez une couche de securite supplementaire a votre compte
          </p>
        </div>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {enabled ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : (
                <ShieldOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  Statut : {enabled ? "Activee" : "Desactivee"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {enabled
                    ? "Votre compte est protege par la 2FA"
                    : "Activez la 2FA pour securiser votre compte"}
                </p>
              </div>
            </div>
            <Badge
              variant={enabled ? "default" : "secondary"}
              className={
                enabled
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : ""
              }
            >
              {enabled ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Idle state - show enable/disable button */}
      {step === "idle" && (
        <div className="flex gap-2">
          {!enabled ? (
            <Button onClick={handleSetup} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Activer 2FA
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleRegenerateCodes}
                disabled={regenerating}
              >
                {regenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerer les codes de secours
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDisableDialogOpen(true)}
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                Desactiver 2FA
              </Button>
            </>
          )}
        </div>
      )}

      {/* Step 1: Show secret */}
      {step === "show-secret" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">
                Etape 1 : Configurez votre application
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Copiez cette cle secrete dans votre application
                d&apos;authentification (Google Authenticator, Authy, etc.)
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono tracking-wider">
                {formattedSecret}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(secret)}
                title="Copier la cle"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep("verify")}>Suivant</Button>
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Verify code */}
      {step === "verify" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">
                Etape 2 : Verifiez le code
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Entrez le code a 6 chiffres affiche dans votre application
                d&apos;authentification
              </p>
            </div>

            <div className="max-w-xs space-y-2">
              <Label htmlFor="totp-code">Code de verification</Label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, ""))
                }
                className="text-center text-lg tracking-[0.5em] font-mono"
                autoComplete="one-time-code"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Verifier et activer
              </Button>
              <Button variant="outline" onClick={() => setStep("show-secret")}>
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Show backup codes */}
      {step === "show-backup" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Codes de secours</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Conservez ces codes dans un endroit sur. Chaque code ne peut
                etre utilise qu&apos;une seule fois.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {backupCodes.map((code, index) => (
                <code key={index} className="text-sm font-mono text-center">
                  {code}
                </code>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(backupCodes.join("\n"))}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier les codes
              </Button>
              <Button onClick={() => setStep("idle")}>Terminer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regenerated backup codes display (when already enabled) */}
      {step === "idle" && enabled && backupCodes.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">
                Nouveaux codes de secours
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Conservez ces codes dans un endroit sur.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {backupCodes.map((code, index) => (
                <code key={index} className="text-sm font-mono text-center">
                  {code}
                </code>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => copyToClipboard(backupCodes.join("\n"))}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier les codes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Disable confirmation dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" />
              Desactiver la 2FA
            </DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir desactiver l&apos;authentification a deux
              facteurs ? Votre compte sera moins securise.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisableDialogOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Desactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
