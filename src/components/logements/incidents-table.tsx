"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { INCIDENT_SEVERITY_LABELS, INCIDENT_STATUS_LABELS } from "@/types/database";
import type { Incident } from "@/types/database";

const PAGE_SIZE = 10;

interface Props {
  incidents: Incident[];
}

export function IncidentsTable({ incidents }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = incidents.slice(0, visibleCount);
  const hasMore = visibleCount < incidents.length;

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2 p-3">
        {visible.map((inc) => {
          const isLate = !["RESOLU", "CLOS"].includes(inc.status) &&
            (Date.now() - new Date(inc.opened_at).getTime()) > 7 * 24 * 60 * 60 * 1000;
          return (
            <Link key={inc.id} href={`/incidents/${inc.id}`} className="block border rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge value={inc.severity} label={INCIDENT_SEVERITY_LABELS[inc.severity]} />
                <StatusBadge value={inc.status} label={INCIDENT_STATUS_LABELS[inc.status]} />
                {isLate && <Badge variant="destructive" className="text-xs">En retard</Badge>}
              </div>
              <p className="text-sm font-medium line-clamp-2">{inc.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(inc.opened_at).toLocaleDateString("fr-FR")}
              </p>
            </Link>
          );
        })}
        {incidents.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Aucun incident pour ce logement
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sévérité</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Ouvert le</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((inc) => {
              const isLate = !["RESOLU", "CLOS"].includes(inc.status) &&
                (Date.now() - new Date(inc.opened_at).getTime()) > 7 * 24 * 60 * 60 * 1000;
              return (
                <TableRow key={inc.id}>
                  <TableCell>
                    <StatusBadge value={inc.severity} label={INCIDENT_SEVERITY_LABELS[inc.severity]} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/incidents/${inc.id}`} className="hover:underline font-medium">
                        {inc.description?.slice(0, 60)}
                      </Link>
                      {isLate && <Badge variant="destructive" className="text-xs">En retard</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inc.opened_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={inc.status} label={INCIDENT_STATUS_LABELS[inc.status]} />
                  </TableCell>
                </TableRow>
              );
            })}
            {incidents.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Aucun incident pour ce logement
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center py-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Afficher plus ({incidents.length - visibleCount} restant{incidents.length - visibleCount > 1 ? "s" : ""})
          </Button>
        </div>
      )}
    </>
  );
}
