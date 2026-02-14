"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Step 2: Organisation + Profile
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgCity, setOrgCity] = useState("");

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

    setStep(2);
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
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          org_name: orgName.trim(),
          org_city: orgCity.trim() || null,
        },
      },
    });

    if (authError) {
      setError(authError.message === "User already registered"
        ? "Cet email est déjà utilisé. Voulez-vous vous connecter ?"
        : authError.message
      );
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Erreur lors de la création du compte");
      setLoading(false);
      return;
    }

    // 2. Update organisation name and city
    const { data: profile } = await supabase
      .from('profiles')
      .select('organisation_id')
      .eq('id', authData.user.id)
      .single();

    if (profile?.organisation_id) {
      await supabase
        .from('organisations')
        .update({
          name: orgName.trim(),
          city: orgCity.trim() || null,
          onboarding_completed: true,
        })
        .eq('id', profile.organisation_id);
    }

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
      // Show success message
      alert("Email renvoyé ! Vérifiez votre boîte de réception.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 4 ? "Vérifiez votre email" : "Créer votre compte ConciergeOS"}
          </CardTitle>
          <CardDescription>
            {step === 4
              ? "Une dernière étape avant d'accéder à votre espace"
              : step === 3
              ? "Dernière étape !"
              : `Étape ${step} sur 3`
            }
          </CardDescription>

          {/* Stepper - Hidden on step 4 */}
          {step < 4 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      s < step
                        ? 'bg-primary text-primary-foreground'
                        : s === step
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`h-0.5 w-12 mx-1 ${
                        s < step ? 'bg-primary' : 'bg-gray-200'
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
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                {passwordStrength && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${
                            i <= passwordStrength.strength
                              ? passwordStrength.color
                              : 'bg-gray-200'
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
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
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
                <div>
                  <p className="font-medium">Conciergerie</p>
                  <p className="text-muted-foreground">
                    {orgName}
                    {orgCity && ` • ${orgCity}`}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-blue-900 mb-1">📧 Vérification email</p>
                <p className="text-blue-700">
                  Après création, vous recevrez un email de confirmation à{" "}
                  <strong>{email}</strong>. Pensez à vérifier vos spams.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
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
                  {loading ? 'Création du compte...' : 'Créer mon compte'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Email Verification */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
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

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-left">
                <p className="font-medium text-yellow-900 mb-2">📌 Instructions</p>
                <ol className="text-yellow-800 space-y-1 list-decimal list-inside">
                  <li>Ouvrez votre boîte email</li>
                  <li>Recherchez l&apos;email de ConciergeOS</li>
                  <li>Cliquez sur le lien de confirmation</li>
                  <li>Vous serez automatiquement redirigé vers votre dashboard</li>
                </ol>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p>💡 L&apos;email peut prendre quelques minutes à arriver.</p>
                <p className="mt-1">Pensez à vérifier vos <strong>spams</strong> si vous ne le voyez pas.</p>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Envoi...' : 'Renvoyer l\'email'}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Mauvaise adresse email ?{" "}
                  <button
                    onClick={() => setStep(1)}
                    className="underline hover:text-primary"
                  >
                    Recommencer
                  </button>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
