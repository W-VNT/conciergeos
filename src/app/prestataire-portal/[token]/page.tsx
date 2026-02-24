"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wrench,
  AlertTriangle,
  ClipboardList,
  FileText,
  Receipt,
  Play,
  CheckCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format-currency";
import {
  MISSION_STATUS_LABELS,
  MISSION_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_SEVERITY_LABELS,
  DEVIS_STATUS_LABELS,
  FACTURE_STATUS_LABELS,
} from "@/types/database";
import type {
  DevisStatus,
  FactureStatus,
  MissionStatus,
  MissionType,
  IncidentStatus,
  IncidentSeverity,
} from "@/types/database";
import {
  getPrestatairePortalData,
  updateMissionStatusFromPortal,
  updateIncidentStatusFromPortal,
  submitDevisFromPortal,
  type PrestatairePortalData,
} from "@/lib/actions/prestataire-portal";

export default function PrestatairePortalPage({
  params,
}: {
  params: { token: string };
}) {
  const token = params.token;
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [expired, setExpired] = useState(false);
  const [data, setData] = useState<PrestatairePortalData | null>(null);
  const [activeTab, setActiveTab] = useState<"missions" | "incidents" | "devis" | "factures">("missions");
  const [isPending, startTransition] = useTransition();

  // Devis form state
  const [devisOpen, setDevisOpen] = useState(false);
  const [devisIncidentId, setDevisIncidentId] = useState("");
  const [devisMissionId, setDevisMissionId] = useState("");
  const [devisMontant, setDevisMontant] = useState("");
  const [devisDescription, setDevisDescription] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    const result = await getPrestatairePortalData(token);
    setValid(result.valid);
    setExpired(result.expired ?? false);
    setData(result.data ?? null);
    setLoading(false);
  }

  function handleUpdateMission(missionId: string, status: "EN_COURS" | "TERMINE") {
    startTransition(async () => {
      const res = await updateMissionStatusFromPortal(token, missionId, status);
      if (res.success) {
        toast.success(res.message);
        await loadData();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleUpdateIncident(incidentId: string, status: "EN_COURS" | "RESOLU") {
    startTransition(async () => {
      const res = await updateIncidentStatusFromPortal(token, incidentId, status);
      if (res.success) {
        toast.success(res.message);
        await loadData();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleSubmitDevis() {
    const montant = parseFloat(devisMontant);
    if (isNaN(montant) || montant <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (!devisDescription.trim()) {
      toast.error("Description requise");
      return;
    }
    startTransition(async () => {
      const res = await submitDevisFromPortal(token, {
        incidentId: devisIncidentId || undefined,
        missionId: devisMissionId || undefined,
        montant,
        description: devisDescription.trim(),
      });
      if (res.success) {
        toast.success(res.message);
        setDevisOpen(false);
        setDevisIncidentId("");
        setDevisMissionId("");
        setDevisMontant("");
        setDevisDescription("");
        await loadData();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-xl font-semibold">
                {expired ? "Lien expiré" : "Lien invalide"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {expired
                  ? "Ce lien d'accès a expiré. Veuillez contacter votre gestionnaire pour obtenir un nouveau lien."
                  : "Ce lien n'est pas valide. Veuillez vérifier l'URL ou contacter votre gestionnaire."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { prestataire, missions, incidents, devis, factures } = data!;

  const tabs = [
    { key: "missions" as const, label: "Mes Missions", icon: ClipboardList, count: missions.length },
    { key: "incidents" as const, label: "Mes Incidents", icon: AlertTriangle, count: incidents.length },
    { key: "devis" as const, label: "Mes Devis", icon: FileText, count: devis.length },
    { key: "factures" as const, label: "Mes Factures", icon: Receipt, count: factures.length },
  ];

  return (
    <>
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                Portail Prestataire
              </h1>
              <p className="text-sm text-muted-foreground">
                {prestataire.full_name}
                {prestataire.email && ` — ${prestataire.email}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Tab navigation */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.key)}
                className="gap-2 whitespace-nowrap"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tab.count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        {/* Missions Tab */}
        {activeTab === "missions" && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Mes Missions</h2>
            {missions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucune mission en cours
                </CardContent>
              </Card>
            ) : (
              missions.map((mission) => {
                const logement = mission.logement as { id: string; name: string } | null;
                return (
                  <Card key={mission.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {MISSION_TYPE_LABELS[mission.type as MissionType]}
                            </Badge>
                            <Badge variant="outline">
                              {MISSION_STATUS_LABELS[mission.status as MissionStatus]}
                            </Badge>
                          </div>
                          {logement && (
                            <p className="text-sm text-muted-foreground">{logement.name}</p>
                          )}
                          <p className="text-sm">
                            Prévu le{" "}
                            {new Date(mission.scheduled_at).toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {mission.notes && (
                            <p className="text-sm text-muted-foreground">{mission.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {mission.status === "A_FAIRE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleUpdateMission(mission.id, "EN_COURS")}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Démarrer
                            </Button>
                          )}
                          {mission.status === "EN_COURS" && (
                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleUpdateMission(mission.id, "TERMINE")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Terminer
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === "incidents" && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Mes Incidents</h2>
            {incidents.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucun incident en cours
                </CardContent>
              </Card>
            ) : (
              incidents.map((incident) => {
                const logement = incident.logement as { id: string; name: string } | null;
                return (
                  <Card key={incident.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                incident.severity === "CRITIQUE"
                                  ? "destructive"
                                  : incident.severity === "MOYEN"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {INCIDENT_SEVERITY_LABELS[incident.severity as IncidentSeverity]}
                            </Badge>
                            <Badge variant="outline">
                              {INCIDENT_STATUS_LABELS[incident.status as IncidentStatus]}
                            </Badge>
                          </div>
                          {logement && (
                            <p className="text-sm text-muted-foreground">{logement.name}</p>
                          )}
                          <p className="text-sm">{incident.description}</p>
                          {incident.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{incident.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {incident.status === "OUVERT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleUpdateIncident(incident.id, "EN_COURS")}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Prendre en charge
                            </Button>
                          )}
                          {incident.status === "EN_COURS" && (
                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleUpdateIncident(incident.id, "RESOLU")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Résolu
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Devis Tab */}
        {activeTab === "devis" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Mes Devis</h2>
              <Dialog open={devisOpen} onOpenChange={setDevisOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Soumettre un devis
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Soumettre un devis</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {incidents.length > 0 && (
                      <div className="space-y-2">
                        <Label>Incident lié (optionnel)</Label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={devisIncidentId}
                          onChange={(e) => setDevisIncidentId(e.target.value)}
                        >
                          <option value="">-- Aucun --</option>
                          {incidents.map((inc) => (
                            <option key={inc.id} value={inc.id}>
                              {inc.description.slice(0, 60)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {missions.length > 0 && (
                      <div className="space-y-2">
                        <Label>Mission liée (optionnel)</Label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={devisMissionId}
                          onChange={(e) => setDevisMissionId(e.target.value)}
                        >
                          <option value="">-- Aucune --</option>
                          {missions.map((m) => (
                            <option key={m.id} value={m.id}>
                              {MISSION_TYPE_LABELS[m.type as MissionType]} -{" "}
                              {new Date(m.scheduled_at).toLocaleDateString("fr-FR")}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Montant (EUR) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={devisMontant}
                        onChange={(e) => setDevisMontant(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description *</Label>
                      <textarea
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                        value={devisDescription}
                        onChange={(e) => setDevisDescription(e.target.value)}
                        placeholder="Décrivez les travaux prévus..."
                      />
                    </div>
                    <Button
                      className="w-full"
                      disabled={isPending}
                      onClick={handleSubmitDevis}
                    >
                      {isPending ? "Envoi en cours..." : "Soumettre le devis"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {devis.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucun devis
                </CardContent>
              </Card>
            ) : (
              devis.map((d) => (
                <Card key={d.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatCurrency(d.montant)}</span>
                          <DevisStatusBadge status={d.status as DevisStatus} />
                        </div>
                        <p className="text-sm">{d.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Soumis le {new Date(d.submitted_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Factures Tab */}
        {activeTab === "factures" && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Mes Factures</h2>
            {factures.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucune facture
                </CardContent>
              </Card>
            ) : (
              factures.map((f) => (
                <Card key={f.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatCurrency(f.montant)}</span>
                          <FactureStatusBadge status={f.status as FactureStatus} />
                        </div>
                        {f.numero_facture && (
                          <p className="text-sm text-muted-foreground">
                            N° {f.numero_facture}
                          </p>
                        )}
                        {f.description && <p className="text-sm">{f.description}</p>}
                        <p className="text-xs text-muted-foreground">
                          Emission : {new Date(f.date_emission).toLocaleDateString("fr-FR")}
                          {f.date_echeance &&
                            ` | Echéance : ${new Date(f.date_echeance).toLocaleDateString("fr-FR")}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <Separator />
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Propulsé par ConciergeOS
          </p>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Helper badge components
// ---------------------------------------------------------------------------

function DevisStatusBadge({ status }: { status: DevisStatus }) {
  const variant =
    status === "ACCEPTE"
      ? "default"
      : status === "REFUSE"
      ? "destructive"
      : "secondary";
  return <Badge variant={variant}>{DEVIS_STATUS_LABELS[status]}</Badge>;
}

function FactureStatusBadge({ status }: { status: FactureStatus }) {
  const variant =
    status === "PAYEE"
      ? "default"
      : status === "VALIDEE"
      ? "secondary"
      : status === "REFUSEE"
      ? "destructive"
      : "outline";
  return <Badge variant={variant}>{FACTURE_STATUS_LABELS[status]}</Badge>;
}
