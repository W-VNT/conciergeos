"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { removeAvailabilitySlot, removeBlackout } from "@/lib/actions/prestataire-availability";

const DAY_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

interface Props {
  slots: any[];
  blackouts: any[];
  prestataireId: string;
}

export function AvailabilitySection({ slots, blackouts, prestataireId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleRemoveSlot(id: string) {
    startTransition(async () => {
      await removeAvailabilitySlot(id);
      router.refresh();
    });
  }

  async function handleRemoveBlackout(id: string) {
    startTransition(async () => {
      await removeBlackout(id);
      router.refresh();
    });
  }

  // Group slots by day
  const byDay = new Map<number, any[]>();
  for (const s of slots) {
    const arr = byDay.get(s.day_of_week) || [];
    arr.push(s);
    byDay.set(s.day_of_week, arr);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Disponibilité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly schedule */}
        <div>
          <p className="text-sm font-medium mb-2">Créneaux hebdomadaires</p>
          {slots.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun créneau défini (disponible par défaut).</p>
          ) : (
            <div className="space-y-1">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const daySlots = byDay.get(day);
                if (!daySlots) return null;
                return (
                  <div key={day} className="flex items-center gap-2 text-sm">
                    <span className="w-20 font-medium text-xs">{DAY_LABELS[day]}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {daySlots.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-1 bg-muted rounded px-2 py-0.5 text-xs">
                          <span>{s.start_time} — {s.end_time}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" disabled={isPending} onClick={() => handleRemoveSlot(s.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Blackout periods */}
        <div>
          <p className="text-sm font-medium mb-2">Indisponibilités</p>
          {blackouts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune indisponibilité programmée.</p>
          ) : (
            <div className="space-y-2">
              {blackouts.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded border text-sm">
                  <div>
                    <span className="font-medium">
                      {format(new Date(b.start_date), "d MMM", { locale: fr })} — {format(new Date(b.end_date), "d MMM yyyy", { locale: fr })}
                    </span>
                    {b.reason && <span className="ml-2 text-xs text-muted-foreground">{b.reason}</span>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={isPending} onClick={() => handleRemoveBlackout(b.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
