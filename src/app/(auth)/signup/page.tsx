"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle2, Mail, Eye, EyeOff, ExternalLink } from "lucide-react";
import Link from "next/link";
import { verifyInvitationToken } from "@/lib/actions/team";
import { toast } from "sonner";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Invitation handling
  const invitationToken = searchParams.get("invitation");
  const invitationEmail = searchParams.get("email");
  const [isInvitation, setIsInvitation] = useState(false);
  const [invitationOrgName, setInvitationOrgName] = useState<string>("");

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Step 2: Organisation + Profile
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgCity, setOrgCity] = useState("");

  // Step 4: Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);

  // Check invitation and pre-fill data
  useEffect(() => {
    async function checkInvitation() {
      if (invitationToken && invitationEmail) {
        const result = await verifyInvitationToken(invitationToken);
        if (!result.error && result.invitation) {
          setIsInvitation(true);
          setEmail(invitationEmail);
          setInvitationOrgName(result.invitation.organisation?.name || "");
          if (result.invitation.invited_name) {
            setFullName(result.invitation.invited_name);
          }
        }
      }
    }

    checkInvitation();
  }, [invitationToken, invitationEmail]);

  // Check if user is already signed up but email not confirmed
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user && !user.email_confirmed_at) {
        // User exists but email not confirmed → go to step 4
        setEmail(user.email || "");
        setStep(4);
      } else if (user && user.email_confirmed_at) {
        // User exists and email confirmed → redirect to dashboard
        router.push('/dashboard');
      }
    }

    checkUser();
  }, [supabase, router]);

  // Polling: auto-redirect when email is confirmed (step 4)
  useEffect(() => {
    if (step !== 4) return;
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        router.push("/dashboard");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, supabase, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Password strength
  function getPasswordStrength(pass: string): { strength: number; label: string; color: string } {
    if (pass.length < 6) return { strength: 0, label: "Trop court", color: "bg-red-500" };
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;

    if (strength <= 1) return { strength: 1, label: "Faible", color: "bg-orange-500" };
    if (strength === 2) return { strength: 2, label: "Moyen", color: "bg-yellow-500" };
    if (strength === 3) return { strength: 3, label: "Bon", color: "bg-blue-500" };
    return { strength: 4, label: "Fort", color: "bg-green-500" };
  }

  const passwordStrength = password ? getPasswordStrength(password) : null;

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (!acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation");
      return;
    }

    // If invitation, skip org step and go directly to confirmation
    if (isInvitation) {
      setStep(3);
    } else {
      setStep(2);
    }
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Votre nom est requis");
      return;
    }

    if (!orgName.trim() || orgName.trim().length < 2) {
      setError("Le nom de la conciergerie est requis");
      return;
    }

    setStep(3);
  }

  async function handleFinalSubmit() {
    setLoading(true);
    setError(null);

    // 1. Create Supabase auth account
    const signupOptions: any = {
      data: {
        full_name: fullName.trim(),
      },
    };

    // Only add org data if NOT an invitation
    if (!isInvitation) {
      signupOptions.data.org_name = orgName.trim();
      signupOptions.data.org_city = orgCity.trim() || null;
    } else {
      // Mark this as invitation signup to prevent org creation
      signupOptions.data.is_invitation = true;
      signupOptions.data.invitation_token = invitationToken;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: signupOptions,
    });

    if (authError) {
      setError(authError.message === "User already registered"
        ? "Cet email est déjà utilisé. Voulez-vous vous connecter ?"
        : "Une erreur est survenue lors de la création du compte"
      );
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Erreur lors de la création du compte");
      setLoading(false);
      return;
    }

    // Supabase returns a fake success with empty identities when email already exists
    if (authData.user.identities && authData.user.identities.length === 0) {
      setError("Un compte existe déjà avec cet email. Connectez-vous ou réinitialisez votre mot de passe.");
      setLoading(false);
      return;
    }

    // Note: handle_onboarding trigger will automatically:
    // - If invitation: create profile in invited organisation
    // - If normal signup: create new organisation and admin profile

    setLoading(false);
    // Go to email verification step instead of redirecting
    setStep(4);
  }

  async function handleResendEmail() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });

    if (error) {
      setError("Erreur lors de l'envoi de l'email");
    } else {
      setError(null);
      toast.success("Email renvoyé ! Vérifiez votre boîte de réception.");
      setResendCooldown(60);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 4 ? "Vérifiez votre email" : isInvitation ? `Rejoindre ${invitationOrgName}` : "Créer votre compte ConciergeOS"}
          </CardTitle>
          <CardDescription>
            {step === 4
              ? "Une dernière étape avant d'accéder à votre espace"
              : isInvitation
              ? "Créez votre compte pour accepter l'invitation"
              : step === 3
              ? "Dernière étape !"
              : `Étape ${step} sur 3`
            }
          </CardDescription>

          {/* Stepper - Hidden on step 4 and for invitations */}
          {step < 4 && !isInvitation && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      s < step
                        ? 'bg-primary text-primary-foreground'
                        : s === step
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`h-0.5 w-12 mx-1 ${
                        s < step ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          {step < 4 && isInvitation && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      (s === 1 && step === 1) || (s === 2 && step === 3)
                        ? 'bg-primary text-primary-foreground'
                        : s === 1 && step === 3
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {(s === 1 && step === 3) ? '✓' : s}
                  </div>
                  {s < 2 && (
                    <div
                      className={`h-0.5 w-12 mx-1 ${
                        step === 3 ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive" role="alert">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Créez votre compte
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@votreconciergerie.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  readOnly={isInvitation}
                  className={isInvitation ? "bg-muted" : ""}
                />
                {isInvitation && (
                  <p className="text-xs text-muted-foreground">
                    Email de l'invitation (non modifiable)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${
                            i <= passwordStrength.strength
                              ? passwordStrength.color
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Force : {passwordStrength.label}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Min 8 caractères, avec majuscule et chiffre recommandés
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  J&apos;accepte les{" "}
                  <Link href="/cgu" className="underline hover:text-primary" target="_blank">
                    conditions d&apos;utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link href="/privacy" className="underline hover:text-primary" target="_blank">
                    politique de confidentialité
                  </Link>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                Continuer
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Link href="/login" className="underline hover:text-primary">
                  Se connecter
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: Organisation + Profile */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Votre conciergerie
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-name">Votre nom complet *</Label>
                <Input
                  id="full-name"
                  placeholder="Ex: Marie Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  autoComplete="name"
                />
                <p className="text-xs text-muted-foreground">
                  Ce nom apparaîtra sur votre profil
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-name">Nom de la conciergerie *</Label>
                <Input
                  id="org-name"
                  placeholder="Ex: Riviera Conciergerie"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  minLength={2}
                  autoComplete="organization"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-city">Ville principale</Label>
                <Input
                  id="org-city"
                  placeholder="Ex: Nice, Cannes, Paris..."
                  value={orgCity}
                  onChange={(e) => setOrgCity(e.target.value)}
                  autoComplete="address-level2"
                />
                <p className="text-xs text-muted-foreground">
                  La ville où se situent la majorité de vos logements
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  Continuer
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Confirmation & Submit */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Vérification
                </h3>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                <div>
                  <p className="font-medium">Compte</p>
                  <p className="text-muted-foreground">{email}</p>
                </div>
                <div>
                  <p className="font-medium">Nom</p>
                  <p className="text-muted-foreground">{fullName}</p>
                </div>
                {isInvitation ? (
                  <div>
                    <p className="font-medium">Vous rejoignez</p>
                    <p className="text-muted-foreground">{invitationOrgName}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Conciergerie</p>
                    <p className="text-muted-foreground">
                      {orgName}
                      {orgCity && ` • ${orgCity}`}
                    </p>
                  </div>
                )}
              </div>

              {isInvitation ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm">
                  <p className="font-medium text-green-900 dark:text-green-200 mb-1">✓ Invitation</p>
                  <p className="text-green-700 dark:text-green-300">
                    Votre compte sera créé et vous rejoindrez automatiquement{" "}
                    <strong>{invitationOrgName}</strong>.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">📧 Vérification email</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Après création, vous recevrez un email de confirmation à{" "}
                    <strong>{email}</strong>. Pensez à vérifier vos spams.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(isInvitation ? 1 : 2)}
                  className="flex-1"
                  disabled={loading}
                >
                  Retour
                </Button>
                <Button
                  onClick={handleFinalSubmit}
                  className="flex-1"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Création du compte...' : isInvitation ? 'Accepter et créer mon compte' : 'Créer mon compte'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Email Verification */}
          {step === 4 && (() => {
            const domain = email.split('@')[1]?.toLowerCase() || '';
            const emailProviders: { domains: string[]; name: string; url: string; color: string; icon: string }[] = [
              { domains: ['gmail.com', 'googlemail.com'], name: 'Gmail', url: 'https://mail.google.com', color: 'bg-red-500 hover:bg-red-600', icon: '📧' },
              { domains: ['outlook.com', 'hotmail.com', 'hotmail.fr', 'live.com', 'live.fr', 'msn.com'], name: 'Outlook', url: 'https://outlook.live.com', color: 'bg-blue-600 hover:bg-blue-700', icon: '📨' },
              { domains: ['yahoo.com', 'yahoo.fr', 'ymail.com'], name: 'Yahoo Mail', url: 'https://mail.yahoo.com', color: 'bg-purple-600 hover:bg-purple-700', icon: '📬' },
              { domains: ['icloud.com', 'me.com', 'mac.com'], name: 'iCloud Mail', url: 'https://www.icloud.com/mail', color: 'bg-gray-600 hover:bg-gray-700', icon: '🍎' },
              { domains: ['protonmail.com', 'proton.me', 'pm.me'], name: 'ProtonMail', url: 'https://mail.proton.me', color: 'bg-violet-600 hover:bg-violet-700', icon: '🔒' },
            ];
            const matched = emailProviders.find(p => p.domains.includes(domain));

            return (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Mail className="h-10 w-10 text-blue-600" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Consultez votre boîte email</h3>
                <p className="text-muted-foreground">
                  Nous avons envoyé un email de confirmation à
                </p>
                <p className="text-lg font-medium mt-1">{email}</p>
              </div>

              {matched ? (
                <a
                  href={matched.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-2 w-full rounded-lg px-6 py-3 text-white font-medium text-base transition-colors ${matched.color}`}
                >
                  <span className="text-lg">{matched.icon}</span>
                  Ouvrir {matched.name}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center justify-center gap-2 w-full rounded-lg px-6 py-3 bg-primary text-primary-foreground font-medium text-base transition-colors hover:bg-primary/90"
                >
                  <Mail className="h-4 w-4" />
                  Ouvrir mon application mail
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p>L&apos;email peut prendre quelques minutes à arriver.</p>
                <p className="mt-1">Pensez à vérifier vos <strong>spams</strong> si vous ne le voyez pas.</p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                  disabled={loading || resendCooldown > 0}
                >
                  {loading
                    ? 'Envoi...'
                    : resendCooldown > 0
                      ? `Renvoyer (${resendCooldown}s)`
                      : 'Renvoyer l\'email'}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Mauvaise adresse email ?{" "}
                  <Link
                    href="/login"
                    className="underline hover:text-primary"
                  >
                    Se connecter avec un autre compte
                  </Link>
                </p>
              </div>
            </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
