"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PROPRIETAIRE_DOC_TYPE_LABELS,
  type ProprietaireDocType,
  type ProprietaireDocument,
} from "@/types/database";
import {
  getProprietaireDocuments,
  createProprietaireDocument,
  deleteProprietaireDocument,
} from "@/lib/actions/proprietaire-documents";
import { toast } from "sonner";
import { FileText, Plus, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/format-date";

interface DocumentsSectionProps {
  proprietaireId: string;
}

export function ProprietaireDocumentsSection({ proprietaireId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<ProprietaireDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "AUTRE" as string,
    file_url: "",
    expires_at: "",
    notes: "",
  });

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDocuments() {
    setLoading(true);
    const data = await getProprietaireDocuments(proprietaireId);
    setDocuments(data);
    setLoading(false);
  }

  function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  function handleCreate() {
    if (!form.name || !form.file_url) {
      toast.error("Nom et fichier sont requis");
      return;
    }
    startTransition(async () => {
      const res = await createProprietaireDocument({
        proprietaire_id: proprietaireId,
        name: form.name,
        type: form.type as ProprietaireDocType,
        file_url: form.file_url,
        expires_at: form.expires_at,
        notes: form.notes,
      });
      if (res.success) {
        toast.success(res.message);
        setForm({ name: "", type: "AUTRE", file_url: "", expires_at: "", notes: "" });
        setDialogOpen(false);
        await loadDocuments();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete(docId: string) {
    startTransition(async () => {
      const res = await deleteProprietaireDocument(docId);
      if (res.success) {
        toast.success(res.message);
        await loadDocuments();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Nom *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nom du document"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(PROPRIETAIRE_DOC_TYPE_LABELS) as [
                        ProprietaireDocType,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>URL du fichier *</Label>
                <Input
                  value={form.file_url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, file_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Date d&apos;expiration</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, expires_at: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Notes..."
                />
              </div>
              <Button
                className="w-full"
                disabled={isPending}
                onClick={handleCreate}
              >
                Ajouter le document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun document</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Expiration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const expired = isExpired(doc.expires_at);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {PROPRIETAIRE_DOC_TYPE_LABELS[doc.type as ProprietaireDocType]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {doc.expires_at ? (
                          <span className="inline-flex items-center gap-1">
                            {expired && (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                            )}
                            <span className={expired ? "text-red-600 font-medium" : ""}>
                              {formatDate(doc.expires_at)}
                            </span>
                            {expired && (
                              <Badge variant="destructive" className="text-xs ml-1">
                                Expiré
                              </Badge>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" asChild>
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={isPending}
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
