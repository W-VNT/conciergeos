"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/shared/status-badge";
import { RecurrenceForm } from "./recurrence-form";
import {
  toggleRecurrence,
  deleteRecurrence,
} from "@/lib/actions/mission-recurrences";
import { toast } from "sonner";
import { ChevronDown, Trash2, CalendarClock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MISSION_TYPE_LABELS,
  RECURRENCE_FREQUENCY_LABELS,
} from "@/types/database";
import type { MissionRecurrence } from "@/types/database";

const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: "Dimanche",
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};

function getNextOccurrence(recurrence: MissionRecurrence): string {
  const now = new Date();
  const today = now.getDay(); // 0=Sun, 1=Mon, ...

  if (recurrence.frequency === "HEBDOMADAIRE" && recurrence.day_of_week != null) {
    const targetDay = recurrence.day_of_week;
    let daysUntil = targetDay - today;
    if (daysUntil <= 0) daysUntil += 7;
    const next = new Date(now);
    next.setDate(next.getDate() + daysUntil);
    return `${DAY_OF_WEEK_LABELS[targetDay]} ${next.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`;
  }

  if (recurrence.frequency === "MENSUEL" && recurrence.day_of_month != null) {
    const targetDay = recurrence.day_of_month;
    const next = new Date(now.getFullYear(), now.getMonth(), targetDay);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
    return next.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  if (recurrence.frequency === "BIMENSUEL") {
    // Next occurrence in ~2 weeks from last generated or creation
    const base = recurrence.last_generated_at
      ? new Date(recurrence.last_generated_at)
      : new Date(recurrence.created_at);
    const next = new Date(base);
    next.setDate(next.getDate() + 14);
    if (next <= now) {
      next.setDate(now.getDate() + 1);
    }
    return next.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  return "—";
}

interface RecurrencesSectionProps {
  initialRecurrences: MissionRecurrence[];
  logements: Array<{ id: string; name: string }>;
  operators: Array<{ id: string; full_name: string }>;
}

export function RecurrencesSection({
  initialRecurrences,
  logements,
  operators,
}: RecurrencesSectionProps) {
  const [recurrences, setRecurrences] = useState(initialRecurrences);
  const [open, setOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, active: boolean) => {
    setTogglingId(id);
    startTransition(async () => {
      const result = await toggleRecurrence(id, active);
      if (result.success) {
        setRecurrences((prev) =>
          prev.map((r) => (r.id === id ? { ...r, active } : r))
        );
        toast.success(result.message);
      } else {
        toast.error(result.error ?? "Erreur");
      }
      setTogglingId(null);
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteRecurrence(id);
      if (result.success) {
        setRecurrences((prev) => prev.filter((r) => r.id !== id));
        toast.success(result.message);
      } else {
        toast.error(result.error ?? "Erreur");
      }
      setDeletingId(null);
    });
  };

  const handleSuccess = () => {
    // Force page refresh to get updated data
    window.location.reload();
  };

  return (
    <Card className="mb-4">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Récurrences
            {recurrences.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({recurrences.filter((r) => r.active).length} active{recurrences.filter((r) => r.active).length > 1 ? "s" : ""})
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4">
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <RecurrenceForm
              logements={logements}
              operators={operators}
              onSuccess={handleSuccess}
            />
          </div>

          {recurrences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune récurrence configurée.
            </p>
          ) : (
            <div className="space-y-3">
              {recurrences.map((recurrence) => {
                const logement = Array.isArray(recurrence.logement)
                  ? recurrence.logement[0]
                  : recurrence.logement;

                return (
                  <div
                    key={recurrence.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-sm",
                      !recurrence.active && "opacity-50"
                    )}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {logement?.name ?? "—"}
                        </span>
                        <StatusBadge
                          value={recurrence.type}
                          label={MISSION_TYPE_LABELS[recurrence.type]}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>
                          {RECURRENCE_FREQUENCY_LABELS[recurrence.frequency]}
                        </span>
                        <span>·</span>
                        <span>{recurrence.scheduled_time.slice(0, 5)}</span>
                        <span>·</span>
                        <span>Prochaine : {getNextOccurrence(recurrence)}</span>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch
                        checked={recurrence.active}
                        disabled={togglingId === recurrence.id}
                        onCheckedChange={(checked) =>
                          handleToggle(recurrence.id, checked)
                        }
                      />
                      <RecurrenceForm
                        recurrence={recurrence}
                        logements={logements}
                        operators={operators}
                        onSuccess={handleSuccess}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(recurrence.id)}
                        disabled={deletingId === recurrence.id}
                      >
                        {deletingId === recurrence.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
