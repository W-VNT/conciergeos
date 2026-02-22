import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  variant?: "table" | "card" | "inline";
  colSpan?: number;
  className?: string;
}

/**
 * EmptyState - Reusable empty state component
 *
 * Displays a user-friendly message when no data is available.
 * Supports table and card variants with optional icons and CTAs.
 *
 * @example
 * // Table variant (dans TableBody)
 * <EmptyState
 *   icon={Home}
 *   title="Aucun logement trouvé"
 *   description="Commencez par ajouter votre premier logement"
 *   colSpan={5}
 * />
 *
 * @example
 * // Card variant (standalone)
 * <EmptyState
 *   variant="card"
 *   icon={AlertTriangle}
 *   title="Aucun incident"
 *   description="Ce logement n'a pas d'incident"
 *   action={{ label: "Déclarer", href: "/incidents/new" }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "table",
  colSpan,
  className,
}: EmptyStateProps) {
  const content = (
    <>
      {Icon && (
        <Icon
          className={
            variant === "table"
              ? "h-6 w-6 mx-auto mb-2 text-muted-foreground/50"
              : "h-8 w-8 text-muted-foreground/40 mb-2"
          }
        />
      )}
      <p className={variant === "table" ? "text-muted-foreground" : "font-medium"}>
        {title}
      </p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
      {action && (
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </>
  );

  if (variant === "table") {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="text-center py-8">
          {content}
        </TableCell>
      </TableRow>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-center ${className ?? ""}`}>
        {content}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {content}
      </CardContent>
    </Card>
  );
}
