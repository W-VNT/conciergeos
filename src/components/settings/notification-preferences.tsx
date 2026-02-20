"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/actions/notification-preferences";

export function NotificationPreferencesForm() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    const prefs = await getNotificationPreferences();
    if (prefs) {
      setPreferences(prefs);
    }
    setLoading(false);
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!preferences) return;

    const newValue = !preferences[key];
    setPreferences({ ...preferences, [key]: newValue });

    const result = await updateNotificationPreferences({ [key]: newValue });

    if (result.success) {
      toast.success("Préférence mise à jour");
    } else {
      toast.error(result.error);
      // Revert on error
      setPreferences({ ...preferences, [key]: !newValue });
    }
  };

  if (loading || !preferences) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {/* Missions */}
      <AccordionItem value="missions">
        <AccordionTrigger>Missions</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify_mission_assigned" className="flex-1 cursor-pointer font-normal">
                Assignation de mission
                <p className="text-sm text-muted-foreground">
                  Recevoir un email quand une mission vous est assignée
                </p>
              </Label>
              <Switch
                id="notify_mission_assigned"
                checked={preferences.notify_mission_assigned}
                onCheckedChange={() => handleToggle("notify_mission_assigned")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify_mission_reminder" className="flex-1 cursor-pointer font-normal">
                Rappels de mission
                <p className="text-sm text-muted-foreground">
                  Rappel 24h avant une mission planifiée
                </p>
              </Label>
              <Switch
                id="notify_mission_reminder"
                checked={preferences.notify_mission_reminder}
                onCheckedChange={() => handleToggle("notify_mission_reminder")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify_mission_late" className="flex-1 cursor-pointer font-normal">
                Missions en retard
                <p className="text-sm text-muted-foreground">
                  Alerte pour les missions non complétées à temps
                </p>
              </Label>
              <Switch
                id="notify_mission_late"
                checked={preferences.notify_mission_late}
                onCheckedChange={() => handleToggle("notify_mission_late")}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Incidents */}
      <AccordionItem value="incidents">
        <AccordionTrigger>Incidents</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify_incident_opened" className="flex-1 cursor-pointer font-normal">
                Nouveaux incidents
                <p className="text-sm text-muted-foreground">
                  Notification lors de l'ouverture d'un incident
                </p>
              </Label>
              <Switch
                id="notify_incident_opened"
                checked={preferences.notify_incident_opened}
                onCheckedChange={() => handleToggle("notify_incident_opened")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify_incident_assigned" className="flex-1 cursor-pointer font-normal">
                Assignation d'incident
                <p className="text-sm text-muted-foreground">
                  Notification quand un incident est assigné à un prestataire
                </p>
              </Label>
              <Switch
                id="notify_incident_assigned"
                checked={preferences.notify_incident_assigned}
                onCheckedChange={() => handleToggle("notify_incident_assigned")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify_incident_resolved" className="flex-1 cursor-pointer font-normal">
                Incidents résolus
                <p className="text-sm text-muted-foreground">
                  Notification quand un incident est résolu
                </p>
              </Label>
              <Switch
                id="notify_incident_resolved"
                checked={preferences.notify_incident_resolved}
                onCheckedChange={() => handleToggle("notify_incident_resolved")}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Réservations */}
      <AccordionItem value="reservations">
        <AccordionTrigger>Réservations</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify_reservation_confirmed" className="flex-1 cursor-pointer font-normal">
                Réservations confirmées
                <p className="text-sm text-muted-foreground">
                  Notification pour chaque nouvelle réservation
                </p>
              </Label>
              <Switch
                id="notify_reservation_confirmed"
                checked={preferences.notify_reservation_confirmed}
                onCheckedChange={() => handleToggle("notify_reservation_confirmed")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify_reservation_checkin_soon" className="flex-1 cursor-pointer font-normal">
                Check-in imminent
                <p className="text-sm text-muted-foreground">
                  Rappel 24h avant un check-in
                </p>
              </Label>
              <Switch
                id="notify_reservation_checkin_soon"
                checked={preferences.notify_reservation_checkin_soon}
                onCheckedChange={() => handleToggle("notify_reservation_checkin_soon")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify_reservation_checkout_today" className="flex-1 cursor-pointer font-normal">
                Check-out du jour
                <p className="text-sm text-muted-foreground">
                  Notification pour les check-out du jour
                </p>
              </Label>
              <Switch
                id="notify_reservation_checkout_today"
                checked={preferences.notify_reservation_checkout_today}
                onCheckedChange={() => handleToggle("notify_reservation_checkout_today")}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Alertes */}
      <AccordionItem value="alerts">
        <AccordionTrigger>Alertes importantes</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify_urgent_missions" className="flex-1 cursor-pointer font-normal">
                Missions urgentes
                <p className="text-sm text-muted-foreground">
                  Alerte pour missions urgentes non assignées
                </p>
              </Label>
              <Switch
                id="notify_urgent_missions"
                checked={preferences.notify_urgent_missions}
                onCheckedChange={() => handleToggle("notify_urgent_missions")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify_critical_incidents" className="flex-1 cursor-pointer font-normal">
                Incidents critiques
                <p className="text-sm text-muted-foreground">
                  Alerte pour incidents critiques non résolus
                </p>
              </Label>
              <Switch
                id="notify_critical_incidents"
                checked={preferences.notify_critical_incidents}
                onCheckedChange={() => handleToggle("notify_critical_incidents")}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Résumés */}
      <AccordionItem value="digests">
        <AccordionTrigger>Résumés groupés</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="daily_digest" className="flex-1 cursor-pointer font-normal">
                Résumé quotidien
                <p className="text-sm text-muted-foreground">
                  Recevoir un email quotidien avec un résumé des activités
                </p>
              </Label>
              <Switch
                id="daily_digest"
                checked={preferences.daily_digest}
                onCheckedChange={() => handleToggle("daily_digest")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="weekly_digest" className="flex-1 cursor-pointer font-normal">
                Résumé hebdomadaire
                <p className="text-sm text-muted-foreground">
                  Recevoir un email hebdomadaire avec les statistiques
                </p>
              </Label>
              <Switch
                id="weekly_digest"
                checked={preferences.weekly_digest}
                onCheckedChange={() => handleToggle("weekly_digest")}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
