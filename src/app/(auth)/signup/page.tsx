"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Home, CheckCircle2, Mail } from "lucide-react";
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

  // Step 3: First logement
  const [logementName, setLogementName] = useState("");
  const [logementAddress, setLogementAddress] = useState("");
  const [logementCity, setLogementCity] = useState("");
  const [logementPostalCode, setLogementPostalCode] = useState("");
  const [lockboxCode, setLockboxCode] = useState("");
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

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

  async function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate logement if filled
    if (logementName.trim() && logementName.trim().length < 2) {
      setError("Le nom du logement doit contenir au moins 2 caractères");
      return;
    }

    // Proceed to final step
    setStep(4);
  }

  async function handleSkipStep3() {
    setStep(4);
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

      // 3. Create first logement if provided
      if (logementName.trim()) {
        await supabase.from('logements').insert({
          organisation_id: profile.organisation_id,
          name: logementName.trim(),
          address_line1: logementAddress.trim() || null,
          city: logementCity.trim() || null,
          postal_code: logementPostalCode.trim() || null,
          lockbox_code: lockboxCode.trim() || null,
          wifi_name: wifiName.trim() || null,
          wifi_password: wifiPassword.trim() || null,
          offer_tier: 'ESSENTIEL',
          status: 'ACTIF',
        });
      }
    }

    // Redirect to dashboard
    router.push('/dashboard');
    router.refresh();
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
          <CardTitle className="text-2xl">Créer votre compte ConciergeOS</CardTitle>
          <CardDescription>
            {step === 4
              ? "Dernière étape !"
              : `Étape ${step} sur 4`
            }
          </CardDescription>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3, 4].map((s) => (
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
                {s < 4 && (
                  <div
                    className={`h-0.5 w-12 mx-1 ${
                      s < step ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
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

          {/* Step 3: First logement */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Premier logement (optionnel)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ajoutez votre premier bien en gestion. Vous pourrez en ajouter d&apos;autres plus tard.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logement-name">Nom du logement</Label>
                <Input
                  id="logement-name"
                  placeholder="Ex: Appartement Promenade"
                  value={logementName}
                  onChange={(e) => setLogementName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logement-address">Adresse</Label>
                <Input
                  id="logement-address"
                  placeholder="12 Promenade des Anglais"
                  value={logementAddress}
                  onChange={(e) => setLogementAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="logement-city">Ville</Label>
                  <Input
                    id="logement-city"
                    placeholder="Nice"
                    value={logementCity}
                    onChange={(e) => setLogementCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logement-postal">Code postal</Label>
                  <Input
                    id="logement-postal"
                    placeholder="06000"
                    value={logementPostalCode}
                    onChange={(e) => setLogementPostalCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockbox">Code boîte à clés</Label>
                <Input
                  id="lockbox"
                  placeholder="1234"
                  value={lockboxCode}
                  onChange={(e) => setLockboxCode(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="wifi-name">Nom WiFi</Label>
                  <Input
                    id="wifi-name"
                    placeholder="MyWiFi"
                    value={wifiName}
                    onChange={(e) => setWifiName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifi-password">Mot de passe WiFi</Label>
                  <Input
                    id="wifi-password"
                    type="text"
                    placeholder="••••••••"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkipStep3}
                  disabled={loading}
                >
                  Passer
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  Continuer
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Confirmation & Submit */}
          {step === 4 && (
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
                {logementName && (
                  <div>
                    <p className="font-medium">Premier logement</p>
                    <p className="text-muted-foreground">{logementName}</p>
                  </div>
                )}
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
                  onClick={() => setStep(3)}
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
        </CardContent>
      </Card>
    </div>
  );
}
