"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface Props {
  entityTypes: string[];
  actions: string[];
  currentEntityType: string;
  currentAction: string;
  currentDateFrom: string;
  currentDateTo: string;
}

export function AuditLogFilters({
  entityTypes,
  actions,
  currentEntityType,
  currentAction,
  currentDateFrom,
  currentDateTo,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const applyFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Remove page when filters change
      params.delete("page");

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      const qs = params.toString();
      router.push(`/audit${qs ? `?${qs}` : ""}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push("/audit");
  }, [router]);

  const hasFilters = currentEntityType || currentAction || currentDateFrom || currentDateTo;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="entity_type">
              Type d&apos;entité
            </label>
            <select
              id="entity_type"
              value={currentEntityType}
              onChange={(e) => applyFilters({ entity_type: e.target.value })}
              className="flex h-9 w-full min-w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Tous</option>
              {entityTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="action">
              Action
            </label>
            <select
              id="action"
              value={currentAction}
              onChange={(e) => applyFilters({ action: e.target.value })}
              className="flex h-9 w-full min-w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Toutes</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="date_from">
              Du
            </label>
            <input
              id="date_from"
              type="date"
              value={currentDateFrom}
              onChange={(e) => applyFilters({ date_from: e.target.value })}
              className="flex h-9 w-full min-w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="date_to">
              Au
            </label>
            <input
              id="date_to"
              type="date"
              value={currentDateTo}
              onChange={(e) => applyFilters({ date_to: e.target.value })}
              className="flex h-9 w-full min-w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
