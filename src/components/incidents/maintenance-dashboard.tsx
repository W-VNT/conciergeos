"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Home, Tag, TrendingUp, TrendingDown, Minus, Euro } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import type {
  IncidentByLogement,
  IncidentByCategory,
  IncidentMonthlyTrend,
  IncidentCostSummary,
} from "@/lib/actions/incident-analytics";

interface MaintenanceDashboardProps {
  byLogement: IncidentByLogement[];
  byCategory: IncidentByCategory[];
  monthlyTrends: IncidentMonthlyTrend[];
  costSummary: IncidentCostSummary;
}

export function MaintenanceDashboard({
  byLogement,
  byCategory,
  monthlyTrends,
  costSummary,
}: MaintenanceDashboardProps) {
  const [open, setOpen] = useState(false);

  const totalIncidents = byCategory.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-sm">Tableau de bord maintenance</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Par logement */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Par logement</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {byLogement.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              ) : (
                <ul className="space-y-2">
                  {byLogement.map((item) => (
                    <li key={item.logement_id} className="flex items-center justify-between text-sm">
                      <span className="truncate mr-2">{item.logement_name}</span>
                      <span className="font-semibold tabular-nums">{item.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Par catégorie */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Par catégorie</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              ) : (
                <ul className="space-y-2">
                  {byCategory.map((item) => {
                    const pct = totalIncidents > 0 ? (item.count / totalIncidents) * 100 : 0;
                    return (
                      <li key={item.category} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{item.label}</span>
                          <span className="font-semibold tabular-nums">
                            {item.count}{" "}
                            <span className="text-muted-foreground font-normal">
                              ({Math.round(pct)}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Tendances mensuelles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tendances</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {monthlyTrends.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              ) : (
                <ul className="space-y-1.5">
                  {monthlyTrends.map((item) => (
                    <li key={item.month} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{item.label}</span>
                      <span className="flex items-center gap-1 font-semibold tabular-nums">
                        {item.count}
                        {item.trend === "up" && (
                          <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                        )}
                        {item.trend === "down" && (
                          <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                        )}
                        {item.trend === "stable" && (
                          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Coûts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coûts</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Coût total</dt>
                  <dd className="text-lg font-bold">{formatCurrency(costSummary.totalCost)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Coût moyen</dt>
                  <dd className="text-sm font-semibold">{formatCurrency(costSummary.averageCost)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Incidents avec coût</dt>
                  <dd className="text-sm font-semibold">{costSummary.paidCount}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
