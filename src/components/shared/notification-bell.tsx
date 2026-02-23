"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUnreadNotifications, markAsRead } from "@/lib/actions/notifications";
import type { Notification } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { MISSION_TYPE_LABELS } from "@/types/database";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedOnce = useRef(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    // Only show loading spinner on the first fetch, not on subsequent polls
    if (!hasFetchedOnce.current) {
      setLoading(true);
    }
    const data = await getUnreadNotifications();
    setNotifications(data);
    setLoading(false);
    hasFetchedOnce.current = true;
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Erreur lors du marquage comme lu");
    }
  }

  function getMissionType(notification: Notification): string | null {
    if (notification.metadata?.mission_type) return notification.metadata.mission_type;
    if (notification.type === "MISSION_ASSIGNED" || notification.type === "MISSION_URGENT") {
      const match = notification.message.match(/de type (\w+)/i);
      return match ? match[1] : null;
    }
    return null;
  }

  function getCategoryLabel(notification: Notification): string {
    switch (notification.type) {
      case "MISSION_ASSIGNED":
      case "MISSION_URGENT": return "Mission";
      case "INCIDENT_CRITICAL":
      case "INCIDENT_ASSIGNED": return "Incident";
      case "CONTRACT_EXPIRING": return "Contrat";
      case "RESERVATION_CREATED": return "Réservation";
      case "TEAM_INVITATION": return "Invitation";
      default: return "Système";
    }
  }

  function getNotificationLink(notification: Notification): string {
    if (!notification.entity_type || !notification.entity_id) {
      return "/notifications";
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
        return "/notifications";
    }
  }

  const unreadCount = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unreadCount > 0 ? `Notifications (${unreadCount} non lues)` : "Notifications"}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Link
              href="/notifications"
              className="text-xs text-primary hover:underline"
            >
              Tout voir
            </Link>
          )}
        </div>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Chargement...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer p-0"
                onSelect={() => handleMarkAsRead(notification.id)}
              >
                <Link
                  href={getNotificationLink(notification)}
                  className="flex gap-3 px-4 py-3 w-full hover:bg-muted"
                >
                  <div className="flex-1 min-w-0">
                    {/* Category + mission type badges */}
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{getCategoryLabel(notification)}</Badge>
                      {(() => {
                        const mType = getMissionType(notification);
                        const label = mType ? MISSION_TYPE_LABELS[mType as keyof typeof MISSION_TYPE_LABELS] : null;
                        return label ? <StatusBadge value={mType!} label={label} /> : null;
                      })()}
                    </div>
                    <p className="text-sm font-medium truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="text-center text-sm text-primary cursor-pointer"
              >
                Voir toutes les notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
