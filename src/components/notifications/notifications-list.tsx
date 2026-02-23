"use client";

import { useState, useEffect, useCallback } from "react";
import type { Notification } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markAsRead, markAllAsRead, deleteNotification } from "@/lib/actions/notifications";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Trash2, CheckCheck, Bell } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { MISSION_TYPE_LABELS } from "@/types/database";

interface Props {
  initialNotifications: Notification[];
  userId: string;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationsList({ initialNotifications, userId }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const pollNotifications = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setNotifications(data as Notification[]);
    } catch {
      // Silent fail — next poll will retry
    }
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(pollNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pollNotifications]);

  async function handleMarkAsRead(id: string) {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      toast.success("Notification marquée comme lue");
    } catch (error) {
      toast.error("Erreur lors du marquage");
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      toast.success("Toutes les notifications marquées comme lues");
    } catch (error) {
      toast.error("Erreur lors du marquage");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  }

  // Extract mission type from metadata (new) or message text (legacy)
  function getMissionType(notification: Notification): string | null {
    if (notification.metadata?.mission_type) {
      return notification.metadata.mission_type;
    }
    if (notification.type === "MISSION_ASSIGNED" || notification.type === "MISSION_URGENT") {
      const match = notification.message.match(/de type (\w+)/i);
      return match ? match[1] : null;
    }
    return null;
  }

  function getCategoryLabel(notification: Notification): string {
    switch (notification.type) {
      case "MISSION_ASSIGNED":
      case "MISSION_URGENT":
        return "Mission";
      case "INCIDENT_CRITICAL":
      case "INCIDENT_ASSIGNED":
        return "Incident";
      case "CONTRACT_EXPIRING":
        return "Contrat";
      case "RESERVATION_CREATED":
        return "Réservation";
      case "TEAM_INVITATION":
        return "Invitation";
      default:
        return "Système";
    }
  }

  function renderMessage(notification: Notification, missionType: string | null): React.ReactNode {
    if (missionType) {
      const label = MISSION_TYPE_LABELS[missionType as keyof typeof MISSION_TYPE_LABELS];
      if (label) {
        // Remove "de type XXXX" from the message text and show badge inline
        const simplified = notification.message
          .replace(/une mission de type \w+\s*/i, "")
          .replace(/^(\w)/, (c) => c.toUpperCase());
        return (
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            <StatusBadge value={missionType} label={label} />
            <span>{simplified}</span>
          </span>
        );
      }
    }
    return notification.message;
  }

  function getNotificationLink(notification: Notification): string {
    if (!notification.entity_type || !notification.entity_id) {
      return "#";
    }
    switch (notification.entity_type) {
      case "MISSION":
        return `/missions/${notification.entity_id}`;
      case "INCIDENT":
        return `/incidents/${notification.entity_id}`;
      case "CONTRAT":
        return `/contrats/${notification.entity_id}`;
      case "LOGEMENT":
        return `/logements/${notification.entity_id}`;
      default:
        return "#";
    }
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
          </p>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          variant="card"
          icon={Bell}
          title="Aucune notification"
          description="Vous êtes à jour"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const isUnread = !notification.read_at;
            const link = getNotificationLink(notification);
            const missionType = getMissionType(notification);
            const categoryLabel = getCategoryLabel(notification);

            return (
              <Card
                key={notification.id}
                className={isUnread ? "border-l-4 border-l-primary bg-primary/5" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Category badge */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{categoryLabel}</Badge>
                      </div>
                      {/* Title */}
                      {link !== "#" ? (
                        <Link href={link} className="block hover:underline">
                          <h3 className="font-semibold text-sm">{notification.title}</h3>
                        </Link>
                      ) : (
                        <h3 className="font-semibold text-sm">{notification.title}</h3>
                      )}
                      {/* Message with optional inline mission type badge */}
                      <div className="text-sm text-muted-foreground mt-1">
                        {renderMessage(notification, missionType)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsRead(notification.id)}
                          title="Marquer comme lu"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(notification.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
