"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Home, CheckCircle2 } from "lucide-react";
import { updateOrganisation, createFirstLogement, completeOnboarding } from "@/lib/actions/onboarding";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Step 1: Organisation
  const [orgName, setOrgName] = useState("");
  const [orgCity, setOrgCity] = useState("");

  // Step 2: First logement
  const [logementName, setLogementName] = useState("");
  const [logementAddress, setLogementAddress] = useState("");
  const [logementCity, setLogementCity] = useState("");
  const [logementPostalCode, setLogementPostalCode] = useState("");
  const [lockboxCode, setLockboxCode] = useState("");
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('name', orgName);
    formData.append('city', orgCity);

    const result = await updateOrganisation(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep(2);
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('name', logementName);
    formData.append('address', logementAddress);
    formData.append('city', logementCity);
    formData.append('postal_code', logementPostalCode);
    formData.append('lockbox_code', lockboxCode);
    formData.append('wifi_name', wifiName);
    formData.append('wifi_password', wifiPassword);

    const result = await createFirstLogement(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep(3);
  }

  async function handleSkipStep2() {
    setStep(3);
  }

  async function handleFinish() {
    setLoading(true);
    const result = await completeOnboarding();

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

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
          <CardTitle className="text-2xl">Bienvenue sur ConciergeOS</CardTitle>
          <CardDescription>
            Configurons votre conciergerie en {step === 3 ? '3' : step === 2 ? '2' : '3'} étapes
          </CardDescription>

          {/* Stepper */}
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
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Step 1: Organisation */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Votre conciergerie
                </h3>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-city">Ville principale</Label>
                <Input
                  id="org-city"
                  placeholder="Ex: Nice, Cannes, Paris..."
                  value={orgCity}
                  onChange={(e) => setOrgCity(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  La ville où se situent la majorité de vos logements
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Continuer'}
              </Button>
            </form>
          )}

          {/* Step 2: First logement */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
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
                <Label htmlFor="logement-name">Nom du logement *</Label>
                <Input
                  id="logement-name"
                  placeholder="Ex: Appartement Promenade"
                  value={logementName}
                  onChange={(e) => setLogementName(e.target.value)}
                  required
                  minLength={2}
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
                  className="flex-1"
                  onClick={handleSkipStep2}
                  disabled={loading}
                >
                  Passer cette étape
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Création...' : 'Ajouter ce logement'}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Finish */}
          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Tout est prêt ! 🎉</h3>
                <p className="text-muted-foreground">
                  Votre conciergerie <strong>{orgName}</strong> est configurée.
                  <br />
                  Vous pouvez maintenant accéder à votre dashboard.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 text-sm">
                <p className="font-medium">Prochaines étapes suggérées :</p>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• Ajouter vos propriétaires et logements</li>
                  <li>• Créer vos premières missions</li>
                  <li>• Inviter des membres de votre équipe</li>
                  <li>• Configurer vos prestataires</li>
                </ul>
              </div>

              <Button onClick={handleFinish} className="w-full" size="lg" disabled={loading}>
                {loading ? 'Finalisation...' : 'Accéder au dashboard'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
