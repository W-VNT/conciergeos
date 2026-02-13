import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  ACTIF: "bg-green-100 text-green-800",
  PAUSE: "bg-yellow-100 text-yellow-800",
  ARCHIVE: "bg-gray-100 text-gray-800",
  A_FAIRE: "bg-blue-100 text-blue-800",
  EN_COURS: "bg-yellow-100 text-yellow-800",
  TERMINE: "bg-green-100 text-green-800",
  ANNULE: "bg-gray-100 text-gray-800",
  NORMALE: "bg-gray-100 text-gray-800",
  HAUTE: "bg-orange-100 text-orange-800",
  CRITIQUE: "bg-red-100 text-red-800",
  OUVERT: "bg-red-100 text-red-800",
  RESOLU: "bg-green-100 text-green-800",
  CLOS: "bg-gray-100 text-gray-800",
  MINEUR: "bg-blue-100 text-blue-800",
  MOYEN: "bg-orange-100 text-orange-800",
  STANDARD: "bg-gray-100 text-gray-800",
  VIP: "bg-purple-100 text-purple-800",
  ESSENTIEL: "bg-gray-100 text-gray-800",
  SERENITE: "bg-blue-100 text-blue-800",
  SIGNATURE: "bg-amber-100 text-amber-800",
  CHECKIN: "bg-emerald-100 text-emerald-800",
  CHECKOUT: "bg-sky-100 text-sky-800",
  MENAGE: "bg-violet-100 text-violet-800",
  INTERVENTION: "bg-orange-100 text-orange-800",
  URGENCE: "bg-red-100 text-red-800",
  PLOMBERIE: "bg-blue-100 text-blue-800",
  ELECTRICITE: "bg-yellow-100 text-yellow-800",
  CLIM: "bg-cyan-100 text-cyan-800",
  AUTRE: "bg-gray-100 text-gray-800",
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
        colorMap[value] ?? "bg-gray-100 text-gray-800",
        className
      )}
    >
      {label}
    </Badge>
  );
}
