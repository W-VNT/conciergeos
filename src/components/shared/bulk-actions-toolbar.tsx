"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ReactNode } from "react";

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
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <span className="text-sm font-medium">
        {selectedCount} {pluralizedEntity} sélectionné{selectedCount > 1 ? "s" : ""}
      </span>

      <div className="flex gap-2 ml-auto">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || "outline"}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}

        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
