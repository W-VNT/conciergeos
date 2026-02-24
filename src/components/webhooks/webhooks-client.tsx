"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createWebhookEndpoint,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  getWebhookDeliveries,
} from "@/lib/actions/webhooks";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  Webhook,
  Eye,
  Copy,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { WebhookEndpoint, WebhookDelivery } from "@/types/database";

const AVAILABLE_EVENTS = [
  { value: "reservation.created", label: "Réservation créée" },
  { value: "reservation.updated", label: "Réservation mise à jour" },
  { value: "mission.created", label: "Mission créée" },
  { value: "mission.completed", label: "Mission terminée" },
  { value: "incident.created", label: "Incident créé" },
  { value: "incident.resolved", label: "Incident résolu" },
];

interface WebhooksClientProps {
  initialEndpoints: WebhookEndpoint[];
}

export function WebhooksClient({ initialEndpoints }: WebhooksClientProps) {
  const [endpoints, setEndpoints] = useState(initialEndpoints);
  const [createOpen, setCreateOpen] = useState(false);
  const [deliveriesOpen, setDeliveriesOpen] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(
    null
  );
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isPending, startTransition] = useTransition();

  // Create form state
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [newDescription, setNewDescription] = useState("");

  function resetCreateForm() {
    setNewUrl("");
    setNewEvents([]);
    setNewDescription("");
  }

  function toggleEvent(event: string) {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  function handleCreate() {
    if (!newUrl.trim()) {
      toast.error("L'URL est requise");
      return;
    }
    if (newEvents.length === 0) {
      toast.error("Sélectionnez au moins un événement");
      return;
    }

    startTransition(async () => {
      const result = await createWebhookEndpoint({
        url: newUrl.trim(),
        events: newEvents,
        description: newDescription,
        active: true,
      });

      if (result.success) {
        toast.success(result.message);
        if (result.data?.secret) {
          toast.info(
            `Secret : ${result.data.secret.slice(0, 8)}... (copiez-le maintenant, il ne sera plus affiché)`,
            { duration: 15000 }
          );
        }
        setCreateOpen(false);
        resetCreateForm();
        // Reload data by refreshing the page data
        window.location.reload();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  function handleToggleActive(endpoint: WebhookEndpoint) {
    startTransition(async () => {
      const result = await updateWebhookEndpoint(endpoint.id, {
        active: !endpoint.active,
      });

      if (result.success) {
        setEndpoints((prev) =>
          prev.map((ep) =>
            ep.id === endpoint.id ? { ...ep, active: !ep.active } : ep
          )
        );
        toast.success(result.message);
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  function handleDelete(endpoint: WebhookEndpoint) {
    startTransition(async () => {
      const result = await deleteWebhookEndpoint(endpoint.id);

      if (result.success) {
        setEndpoints((prev) => prev.filter((ep) => ep.id !== endpoint.id));
        toast.success(result.message);
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  function handleViewDeliveries(webhookId: string) {
    setSelectedWebhookId(webhookId);
    setDeliveriesOpen(true);

    startTransition(async () => {
      const data = await getWebhookDeliveries(webhookId);
      setDeliveries(data);
    });
  }

  return (
    <>
      {/* Create button */}
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              Nouveau webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="webhook-url">URL *</Label>
                <Input
                  id="webhook-url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  type="url"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="webhook-desc">Description</Label>
                <Input
                  id="webhook-desc"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description optionnelle..."
                />
              </div>

              <div className="space-y-2">
                <Label>Événements *</Label>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div
                      key={event.value}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={`event-${event.value}`}
                        checked={newEvents.includes(event.value)}
                        onCheckedChange={() => toggleEvent(event.value)}
                      />
                      <label
                        htmlFor={`event-${event.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer le webhook"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Endpoints list */}
      {endpoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Aucun webhook</h3>
            <p className="text-muted-foreground mb-4">
              Les webhooks vous permettent de recevoir des notifications en temps
              réel lorsque des événements se produisent.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Événements
                  </TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((endpoint) => (
                  <TableRow key={endpoint.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono text-xs truncate max-w-[200px] md:max-w-[300px]">
                          {endpoint.url}
                        </p>
                        {endpoint.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {endpoint.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {endpoint.events.map((event) => (
                          <Badge
                            key={event}
                            variant="secondary"
                            className="text-xs"
                          >
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={endpoint.active}
                        onCheckedChange={() => handleToggleActive(endpoint)}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Voir les livraisons"
                          onClick={() => handleViewDeliveries(endpoint.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Supprimer"
                          onClick={() => handleDelete(endpoint)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Deliveries dialog */}
      <Dialog open={deliveriesOpen} onOpenChange={setDeliveriesOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique des livraisons</DialogTitle>
          </DialogHeader>
          {isPending && deliveries.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deliveries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune livraison enregistrée
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Événement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {delivery.event}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {delivery.status_code &&
                      delivery.status_code >= 200 &&
                      delivery.status_code < 300 ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {delivery.status_code}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <XCircle className="h-3.5 w-3.5" />
                          {delivery.status_code || "Erreur"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(delivery.delivered_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
