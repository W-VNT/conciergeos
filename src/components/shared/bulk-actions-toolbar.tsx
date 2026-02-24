"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ReactNode, cloneElement, isValidElement } from "react";

export interface BulkAction {
  label: string;
  icon: ReactNode;
  onClick: () => void | Promise<void>;
  variant?: "default" | "outline" | "destructive" | "ghost";
  disabled?: boolean;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  entityName: string; // "mission", "logement", etc.
  actions: BulkAction[];
  onClear: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  entityName,
  actions,
  onClear,
}: BulkActionsToolbarProps) {
  const pluralizedEntity = selectedCount > 1 ? `${entityName}s` : entityName;

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg">
      <span className="text-xs sm:text-sm font-medium">
        {selectedCount} {pluralizedEntity} sélectionné{selectedCount > 1 ? "s" : ""}
      </span>

      <div className="flex gap-1 sm:gap-2 ml-auto">
        {actions.map((action, index) => {
          // Clone icon to remove margin on mobile
          const iconWithoutMargin = isValidElement(action.icon)
            ? cloneElement(action.icon as React.ReactElement, {
                className: "h-4 w-4 sm:mr-2",
              })
            : action.icon;

          return (
            <Button
              key={index}
              variant={action.variant || "outline"}
              size="default"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {iconWithoutMargin}
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          );
        })}

        <Button variant="ghost" size="icon" onClick={onClear} aria-label="Désélectionner">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
