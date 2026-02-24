"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MissionReportForm } from "./mission-report-form";
import {
  validateMissionReport,
  rejectMissionReport,
} from "@/lib/actions/mission-reports";
import { toast } from "sonner";
import {
  FileText,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Package,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { MissionReport } from "@/types/database";

interface MissionReportSectionProps {
  missionId: string;
  report: MissionReport | null;
  isAdmin: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  SOUMIS: "bg-blue-100 text-blue-800",
  VALIDE: "bg-green-100 text-green-800",
  REJETE: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  SOUMIS: "Soumis",
  VALIDE: "Validé",
  REJETE: "Rejeté",
};

export function MissionReportSection({
  missionId,
  report,
  isAdmin,
}: MissionReportSectionProps) {
  const [isOpen, setIsOpen] = useState(!!report);
  const [isPending, startTransition] = useTransition();

  function handleValidate() {
    if (!report) return;
    startTransition(async () => {
      const result = await validateMissionReport(report.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  function handleReject() {
    if (!report) return;
    startTransition(async () => {
      const result = await rejectMissionReport(report.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Rapport de mission
            {report && (
              <Badge
                variant="secondary"
                className={STATUS_COLORS[report.status] ?? ""}
              >
                {STATUS_LABELS[report.status] ?? report.status}
              </Badge>
            )}
          </CardTitle>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          {report ? (
            <div className="space-y-4">
              {/* Checklist */}
              {report.checklist && report.checklist.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">
                    Checklist
                  </p>
                  <ul className="space-y-1">
                    {report.checklist.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        {item.checked ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span
                          className={
                            item.checked
                              ? "text-green-700"
                              : "text-muted-foreground"
                          }
                        >
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {report.notes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
                </div>
              )}

              {/* Issues */}
              {report.issues_found && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                    Problèmes constatés
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {report.issues_found}
                  </p>
                </div>
              )}

              {/* Supplies */}
              {report.supplies_used && report.supplies_used.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    Fournitures utilisées
                  </p>
                  <ul className="space-y-1">
                    {report.supplies_used.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{item.name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          x{item.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Admin actions */}
              {isAdmin && report.status === "SOUMIS" && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    onClick={handleValidate}
                    disabled={isPending}
                    className="flex-1"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Valider
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isPending}
                    className="flex-1"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeter
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <MissionReportForm missionId={missionId} />
          )}
        </CardContent>
      )}
    </Card>
  );
}
