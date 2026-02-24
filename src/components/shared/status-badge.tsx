import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  EN_ATTENTE: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  CONFIRMEE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  ANNULEE: "bg-red-500/15 text-red-700 dark:text-red-300",
  TERMINEE: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  PAYE: "bg-green-500/15 text-green-700 dark:text-green-300",
  PARTIEL: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  REMBOURSE: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  ACTIF: "bg-green-500/15 text-green-700 dark:text-green-300",
  PAUSE: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  ARCHIVE: "bg-muted text-muted-foreground",
  A_FAIRE: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  EN_COURS: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  TERMINE: "bg-green-500/15 text-green-700 dark:text-green-300",
  ANNULE: "bg-muted text-muted-foreground",
  NORMALE: "bg-muted text-muted-foreground",
  HAUTE: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  CRITIQUE: "bg-red-500/15 text-red-700 dark:text-red-300",
  OUVERT: "bg-red-500/15 text-red-700 dark:text-red-300",
  RESOLU: "bg-green-500/15 text-green-700 dark:text-green-300",
  CLOS: "bg-muted text-muted-foreground",
  MINEUR: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  MOYEN: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  STANDARD: "bg-muted text-muted-foreground",
  VIP: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  ESSENTIEL: "bg-muted text-muted-foreground",
  SERENITE: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  SIGNATURE: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  CHECKIN: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  CHECKOUT: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  MENAGE: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  INTERVENTION: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  URGENCE: "bg-red-500/15 text-red-700 dark:text-red-300",
  PLOMBERIE: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  ELECTRICITE: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  CLIM: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  AUTRE: "bg-muted text-muted-foreground",
};

interface StatusBadgeProps {
  value: string;
  label: string;
  className?: string;
}

export function StatusBadge({ value, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium",
        colorMap[value] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {label}
    </Badge>
  );
}
