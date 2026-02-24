"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { History, ChevronDown, ChevronUp, Eye } from "lucide-react";
import type { ContratVersion } from "@/types/database";
import { getContratVersions } from "@/lib/actions/contrat-versions";

interface VersionHistoryProps {
  contratId: string;
}

export function VersionHistory({ contratId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ContratVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ContratVersion | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadVersions() {
    setLoading(true);
    const data = await getContratVersions(contratId);
    setVersions(data);
    setLoading(false);
  }

  function handleViewVersion(version: ContratVersion) {
    setSelectedVersion(selectedVersion?.id === version.id ? null : version);
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5" />
                Historique des versions
                {versions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {versions.length}
                  </Badge>
                )}
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune version enregistr&eacute;e pour ce contrat.
              </p>
            ) : (
              <>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Modifi&eacute; par</TableHead>
                        <TableHead>R&eacute;sum&eacute;</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {versions.map((v) => {
                        const changer = v.changer as { id: string; full_name: string } | null;
                        return (
                          <TableRow key={v.id}>
                            <TableCell>
                              <Badge variant="outline">v{v.version_number}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(v.created_at).toLocaleString("fr-FR")}
                            </TableCell>
                            <TableCell className="text-sm">
                              {changer?.full_name ?? "\u2014"}
                            </TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">
                              {v.change_summary || "\u2014"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewVersion(v)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {selectedVersion?.id === v.id ? "Masquer" : "Voir"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {selectedVersion && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">v{selectedVersion.version_number}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(selectedVersion.created_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    {selectedVersion.change_summary && (
                      <p className="text-sm mb-3">
                        <span className="font-medium">R&eacute;sum&eacute; :</span>{" "}
                        {selectedVersion.change_summary}
                      </p>
                    )}
                    <div className="bg-background p-3 rounded border text-sm">
                      <p className="font-medium mb-2 text-muted-foreground">
                        Snapshot des donn&eacute;es :
                      </p>
                      <pre className="whitespace-pre-wrap text-xs font-mono overflow-auto max-h-[300px]">
                        {JSON.stringify(selectedVersion.content, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
