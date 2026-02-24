"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Notification } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationsPaginated,
  bulkMarkAsRead,
  bulkDeleteNotifications,
} from "@/lib/actions/notifications";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Trash2, CheckCheck, Bell, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { MISSION_TYPE_LABELS } from "@/types/database";

interface Props {
  initialNotifications: Notification[];
  initialNextCursor: string | null;
  userId: string;
}

const PAGE_SIZE = 20;

export function NotificationsList({
  initialNotifications,
  initialNextCursor,
  userId,
}: Props) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Sentinel element ref for IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ---- Infinite scroll via IntersectionObserver ----
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getNotificationsPaginated(nextCursor, PAGE_SIZE);
      setNotifications((prev) => [...prev, ...result.notifications]);
      setNextCursor(result.nextCursor);
    } catch {
      toast.error("Erreur lors du chargement des notifications");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ---- Selection helpers ----
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  }

  const allSelected =
    notifications.length > 0 && selectedIds.size === notifications.length;
  const someSelected = selectedIds.size > 0;

  // ---- Bulk actions ----
  async function handleBulkMarkAsRead() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const result = await bulkMarkAsRead(ids);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            selectedIds.has(n.id)
              ? { ...n, read_at: n.read_at || new Date().toISOString() }
              : n
          )
        );
        setSelectedIds(new Set());
        toast.success(result.message);
      } else {
        toast.error(result.error || "Erreur lors du marquage");
      }
    } catch {
      toast.error("Erreur lors du marquage");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const result = await bulkDeleteNotifications(ids);
      if (result.success) {
        setNotifications((prev) =>
          prev.filter((n) => !selectedIds.has(n.id))
        );
        setSelectedIds(new Set());
        toast.success(result.message);
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setBulkLoading(false);
    }
  }

  // ---- Single-item actions ----
  async function handleMarkAsRead(id: string) {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      toast.success("Notification marquée comme lue");
    } catch {
      toast.error("Erreur lors du marquage");
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
      toast.success("Toutes les notifications marquées comme lues");
    } catch {
      toast.error("Erreur lors du marquage");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Notification supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  // ---- Render helpers ----
  function getMissionType(notification: Notification): string | null {
    if (notification.metadata?.mission_type) {
      return notification.metadata.mission_type;
    }
    if (
      notification.type === "MISSION_ASSIGNED" ||
      notification.type === "MISSION_URGENT"
    ) {
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

  function renderMessage(
    notification: Notification,
    missionType: string | null
  ): React.ReactNode {
    if (missionType) {
      const label =
        MISSION_TYPE_LABELS[missionType as keyof typeof MISSION_TYPE_LABELS];
      if (label) {
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
      {/* Top bar: unread count + mark all as read */}
      {unreadCount > 0 && !someSelected && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue
            {unreadCount > 1 ? "s" : ""}
          </p>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        </div>
      )}

      {/* Bulk actions toolbar */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            aria-label="Tout sélectionner"
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkMarkAsRead}
              disabled={bulkLoading}
            >
              <Check className="h-4 w-4 mr-2" />
              Marquer comme lu
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer ({selectedIds.size})
            </Button>
          </div>
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
          {/* Select all row (when nothing selected yet) */}
          {!someSelected && notifications.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-1">
              <Checkbox
                checked={false}
                onCheckedChange={toggleSelectAll}
                aria-label="Tout sélectionner"
              />
              <span className="text-xs text-muted-foreground">
                Tout sélectionner
              </span>
            </div>
          )}

          {notifications.map((notification) => {
            const isUnread = !notification.read_at;
            const link = getNotificationLink(notification);
            const missionType = getMissionType(notification);
            const categoryLabel = getCategoryLabel(notification);
            const isSelected = selectedIds.has(notification.id);

            return (
              <Card
                key={notification.id}
                className={`${isUnread ? "border-l-4 border-l-primary bg-primary/5" : ""} ${isSelected ? "ring-2 ring-primary/30" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <div className="flex items-start pt-0.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(notification.id)}
                        aria-label={`Sélectionner la notification : ${notification.title}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Category badge */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabel}
                        </Badge>
                      </div>
                      {/* Title */}
                      {link !== "#" ? (
                        <Link href={link} className="block hover:underline">
                          <h3 className="font-semibold text-sm">
                            {notification.title}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="font-semibold text-sm">
                          {notification.title}
                        </h3>
                      )}
                      {/* Message with optional inline mission type badge */}
                      <div className="text-sm text-muted-foreground mt-1">
                        {renderMessage(notification, missionType)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          {
                            addSuffix: true,
                            locale: fr,
                          }
                        )}
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

          {/* Sentinel element for IntersectionObserver */}
          <div ref={sentinelRef} className="h-1" />

          {/* Loading indicator */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* End of list indicator */}
          {!nextCursor && notifications.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Toutes les notifications ont été chargées
            </p>
          )}
        </div>
      )}
    </div>
  );
}
