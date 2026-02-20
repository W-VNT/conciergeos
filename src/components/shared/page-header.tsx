import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BackButton } from "./back-button";
import { Breadcrumbs } from "./breadcrumbs";

interface PageHeaderProps {
  title: string;
  description?: string;
  createHref?: string;
  createLabel?: string;
  showCreate?: boolean;
  showBack?: boolean;
  backHref?: string;
  children?: React.ReactNode;
  showBreadcrumbs?: boolean;
  entityName?: string;
}

export function PageHeader({
  title,
  description,
  createHref,
  createLabel = "Ajouter",
  showCreate = true,
  showBack = false,
  backHref,
  children,
  showBreadcrumbs = true,
  entityName,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Breadcrumbs - Desktop seulement */}
      {showBreadcrumbs && (
        <div className="hidden md:block">
          <Breadcrumbs entityName={entityName} />
        </div>
      )}

      {/* BackButton - Mobile seulement */}
      {showBack && (
        <div className="md:hidden">
          <BackButton href={backHref} />
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {children}
          {showCreate && createHref && (
            <Button asChild>
              <Link href={createHref}>
                <Plus className="h-4 w-4 mr-2" />
                {createLabel}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
