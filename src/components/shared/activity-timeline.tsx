"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { ActivityLog } from "@/types/database";
import {
  ArrowRightLeft,
  UserPlus,
  MessageSquarePlus,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Activity,
} from "lucide-react";

interface Props {
  logs: ActivityLog[];
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  STATUS_CHANGED: <ArrowRightLeft className="h-3.5 w-3.5" />,
  ASSIGNED: <UserPlus className="h-3.5 w-3.5" />,
  COMMENT_ADDED: <MessageSquarePlus className="h-3.5 w-3.5" />,
  CREATED: <Plus className="h-3.5 w-3.5" />,
  UPDATED: <Pencil className="h-3.5 w-3.5" />,
  DELETED: <Trash2 className="h-3.5 w-3.5" />,
  REMINDER_SENT: <Clock className="h-3.5 w-3.5" />,
};

const ACTION_COLORS: Record<string, string> = {
  STATUS_CHANGED: "bg-blue-500/15 border-blue-400 text-blue-600 dark:text-blue-400",
  ASSIGNED: "bg-purple-500/15 border-purple-400 text-purple-600 dark:text-purple-400",
  COMMENT_ADDED: "bg-green-500/15 border-green-400 text-green-600 dark:text-green-400",
  CREATED: "bg-emerald-500/15 border-emerald-400 text-emerald-600 dark:text-emerald-400",
  UPDATED: "bg-orange-500/15 border-orange-400 text-orange-600 dark:text-orange-400",
  DELETED: "bg-red-500/15 border-red-400 text-red-600 dark:text-red-400",
  REMINDER_SENT: "bg-yellow-500/15 border-yellow-400 text-yellow-600 dark:text-yellow-400",
};

function getActionDescription(log: ActivityLog): string {
  const actorName =
    (log.actor as { full_name?: string } | null)?.full_name ?? "Système";

  switch (log.action) {
    case "STATUS_CHANGED":
      return `${actorName} a changé le statut de ${log.old_value ?? "?"} à ${log.new_value ?? "?"}`;
    case "ASSIGNED":
      return `${actorName} a assigné à ${log.new_value ?? "un prestataire"}`;
    case "COMMENT_ADDED":
      return `${actorName} a ajouté un commentaire`;
    case "CREATED":
      return `${actorName} a créé l'élément`;
    case "UPDATED":
      return `${actorName} a modifié l'élément`;
    case "DELETED":
      return `${actorName} a supprimé l'élément`;
    case "REMINDER_SENT":
      return `Relance automatique envoyée`;
    default:
      return `${actorName} — ${log.action}`;
  }
}

export function ActivityTimeline({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Aucune activité enregistrée
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, index) => {
        const icon = ACTION_ICONS[log.action] ?? <Activity className="h-3.5 w-3.5" />;
        const colorClass =
          ACTION_COLORS[log.action] ??
          "bg-muted border-border text-muted-foreground";

        return (
          <div key={log.id} className="relative pl-8 pb-4">
            {/* Vertical line */}
            {index < logs.length - 1 && (
              <div className="absolute left-2.5 top-7 bottom-0 w-0.5 bg-border" />
            )}

            {/* Dot / icon */}
            <div
              className={`absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${colorClass}`}
            >
              {icon}
            </div>

            {/* Content */}
            <div className="flex items-start justify-between gap-2 min-w-0">
              <p className="text-sm leading-relaxed">
                {getActionDescription(log)}
              </p>
              <time
                className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0"
                title={new Date(log.created_at).toLocaleString("fr-FR")}
              >
                {formatDistanceToNow(new Date(log.created_at), {
                  addSuffix: true,
                  locale: fr,
                })}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}
