"use client";

import { useState } from "react";
import type { Notification } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { markAsRead, markAllAsRead, deleteNotification } from "@/lib/actions/notifications";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Trash2, CheckCheck } from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialNotifications: Notification[];
}

export function NotificationsList({ initialNotifications }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications);

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

  function getNotificationIcon(type: string) {
    switch (type) {
      case "INCIDENT_CRITICAL":
        return "🚨";
      case "MISSION_ASSIGNED":
        return "📋";
      case "MISSION_URGENT":
        return "⚠️";
      case "CONTRACT_EXPIRING":
        return "📄";
      case "RESERVATION_CREATED":
        return "🏠";
      case "INCIDENT_ASSIGNED":
        return "🔧";
      default:
        return "ℹ️";
    }
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
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune notification
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const isUnread = !notification.read_at;
            const link = getNotificationLink(notification);

            return (
              <Card
                key={notification.id}
                className={isUnread ? "border-l-4 border-l-primary bg-primary/5" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {link !== "#" ? (
                        <Link href={link} className="block hover:underline">
                          <h3 className="font-semibold text-sm">{notification.title}</h3>
                        </Link>
                      ) : (
                        <h3 className="font-semibold text-sm">{notification.title}</h3>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
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
