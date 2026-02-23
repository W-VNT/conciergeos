"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { upsertOfferConfig } from "@/lib/actions/offers";
import type { OfferTier, OfferTierConfig } from "@/types/database";
import { Pencil, X, Plus, Check } from "lucide-react";

const TIER_COLORS: Record<OfferTier, { badge: string; border: string }> = {
  ESSENTIEL: { badge: "bg-slate-500/15 text-slate-700 dark:text-slate-300", border: "border-slate-500/20" },
  SERENITE:  { badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",   border: "border-blue-500/20"  },
  SIGNATURE: { badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300", border: "border-amber-500/20" },
};

interface OfferCardProps {
  config: OfferTierConfig;
  onSaved: (updated: OfferTierConfig) => void;
}

function OfferCard({ config, onSaved }: OfferCardProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(config.name);
  const [description, setDescription] = useState(config.description);
  const [commissionRate, setCommissionRate] = useState(config.commission_rate.toString());
  const [services, setServices] = useState<string[]>(config.services);
  const [newService, setNewService] = useState("");

  const colors = TIER_COLORS[config.tier];

  function handleCancel() {
    setName(config.name);
    setDescription(config.description);
    setCommissionRate(config.commission_rate.toString());
    setServices(config.services);
    setNewService("");
    setEditing(false);
  }

  function addService() {
    const trimmed = newService.trim();
    if (!trimmed || services.includes(trimmed)) return;
    setServices([...services, trimmed]);
    setNewService("");
  }

  function removeService(service: string) {
    setServices(services.filter((s) => s !== service));
  }

  async function handleSave() {
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Le taux de commission doit être entre 0 et 100");
      return;
    }

    setSaving(true);
    const result = await upsertOfferConfig({
      tier: config.tier,
      name: name.trim() || config.name,
      description,
      commission_rate: rate,
      services,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Offre mise à jour");
      onSaved({ ...config, name, description, commission_rate: rate, services });
      setEditing(false);
    }
    setSaving(false);
  }

  return (
    <div className={`border rounded-lg p-5 ${colors.border}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-semibold text-base h-8 px-2"
            />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base">{config.name}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                {config.tier}
              </span>
            </div>
          )}
        </div>
        {!editing ? (
          <Button variant="ghost" size="icon" className="relative h-8 w-8 flex-shrink-0 after:content-[''] after:absolute after:-inset-[6px]" onClick={() => setEditing(true)} aria-label="Modifier">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="relative h-8 w-8 after:content-[''] after:absolute after:-inset-[6px]" onClick={handleCancel} aria-label="Annuler">
              <X className="h-4 w-4" />
            </Button>
            <Button size="icon" className="relative h-8 w-8 after:content-[''] after:absolute after:-inset-[6px]" onClick={handleSave} disabled={saving} aria-label="Enregistrer">
              <Check className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Commission */}
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground mb-1 block">Commission (%)</Label>
        {editing ? (
          <Input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            className="w-28 h-8"
          />
        ) : (
          <p className="text-2xl font-bold">{config.commission_rate}%</p>
        )}
      </div>

      {/* Description */}
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
        {editing ? (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="text-sm"
          />
        ) : (
          <p className="text-sm text-muted-foreground">{config.description || "—"}</p>
        )}
      </div>

      {/* Services inclus */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Services inclus</Label>
        <div className="flex flex-wrap gap-1.5">
          {services.map((service) => (
            <Badge
              key={service}
              variant="secondary"
              className="text-xs gap-1 pr-1"
            >
              {service}
              {editing && (
                <button
                  onClick={() => removeService(service)}
                  className="ml-0.5 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {services.length === 0 && !editing && (
            <p className="text-xs text-muted-foreground">Aucun service défini</p>
          )}
        </div>
        {editing && (
          <div className="flex gap-2 mt-2">
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
              placeholder="Ajouter un service..."
              className="h-8 text-sm flex-1"
            />
            <Button type="button" variant="outline" size="icon" className="relative h-8 w-8 after:content-[''] after:absolute after:-inset-[6px]" onClick={addService} aria-label="Ajouter le service">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface OfferSettingsProps {
  initialConfigs: OfferTierConfig[];
}

export default function OfferSettings({ initialConfigs }: OfferSettingsProps) {
  const [configs, setConfigs] = useState(initialConfigs);

  function handleSaved(updated: OfferTierConfig) {
    setConfigs((prev) =>
      prev.map((c) => (c.tier === updated.tier ? updated : c))
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Offres</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez les 3 niveaux d&apos;offre proposés à vos propriétaires — commission, services inclus et description.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {configs.map((config) => (
          <OfferCard key={config.tier} config={config} onSaved={handleSaved} />
        ))}
      </div>
    </div>
  );
}
