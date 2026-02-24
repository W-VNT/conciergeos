"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { CalendarConflict } from "@/lib/actions/calendar-conflicts";
import { MISSION_TYPE_LABELS } from "@/types/database";
import type { MissionType } from "@/types/database";

interface ConflictAlertProps {
  conflicts: CalendarConflict[];
}

export function ConflictAlert({ conflicts }: ConflictAlertProps) {
  const [expanded, setExpanded] = useState(false);

  if (conflicts.length === 0) return null;

  return (
    <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                {conflicts.length} conflit{conflicts.length > 1 ? "s" : ""}{" "}
                detecte{conflicts.length > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Des operateurs ont plusieurs missions programmees en meme temps
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30"
          >
            {expanded ? (
              <>
                Masquer
                <ChevronUp className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Details
                <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-amber-200 dark:border-amber-800 pt-3">
            {conflicts.map((conflict, index) => {
              const m1Label =
                MISSION_TYPE_LABELS[conflict.mission1_type as MissionType] ??
                conflict.mission1_type;
              const m2Label =
                MISSION_TYPE_LABELS[conflict.mission2_type as MissionType] ??
                conflict.mission2_type;

              return (
                <div
                  key={`${conflict.mission1_id}-${conflict.mission2_id}`}
                  className="flex items-start gap-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 p-3"
                >
                  <Badge
                    variant="outline"
                    className="border-amber-400 text-amber-800 dark:text-amber-200 shrink-0 mt-0.5"
                  >
                    #{index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Conflit : {conflict.operator_name} a 2 missions le{" "}
                      {conflict.date} ({m1Label} + {m2Label})
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Link href={`/missions/${conflict.mission1_id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {m1Label}
                        </Button>
                      </Link>
                      <Link href={`/missions/${conflict.mission2_id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {m2Label}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
