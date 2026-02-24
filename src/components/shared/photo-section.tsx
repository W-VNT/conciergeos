"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, Star, GripVertical, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateAttachmentCaption,
  setAttachmentAsMain,
  updateAttachmentPositions,
} from "@/lib/actions/attachments";
import type { EntityType, Attachment } from "@/types/database";

interface Props {
  organisationId: string;
  entityType: EntityType;
  entityId: string;
  initialAttachments: Attachment[];
  canUpload: boolean;
  canDelete: boolean;
  title?: string;
}

export function PhotoSection({
  organisationId,
  entityType,
  entityId,
  initialAttachments,
  canUpload,
  canDelete,
  title = "Photos",
}: Props) {
  // Sort by position, then by created_at
  const sorted = [...initialAttachments].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const [attachments, setAttachments] = useState<Attachment[]>(sorted);
  const [uploading, setUploading] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState("");
  const [savingCaption, setSavingCaption] = useState(false);
  const [settingMain, setSettingMain] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const captionInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const validFiles = Array.from(files).filter((file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`Type non autorise : ${file.type || "inconnu"}. Formats acceptes : JPEG, PNG, WebP, HEIC.`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum : 10 Mo.`);
          return false;
        }
        return true;
      });

      // Calculate starting position for new uploads
      const maxPosition = attachments.length > 0
        ? Math.max(...attachments.map((a) => a.position))
        : -1;

      const results = await Promise.allSettled(
        validFiles.map(async (file, i) => {
          const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
          const path = `${organisationId}/${entityType}/${entityId}/${Date.now()}_${i}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("attachments")
            .upload(path, file);
          if (uploadError) throw uploadError;

          const { data: att, error: dbError } = await supabase
            .from("attachments")
            .insert({
              organisation_id: organisationId,
              entity_type: entityType,
              entity_id: entityId,
              storage_path: path,
              mime_type: file.type,
              position: maxPosition + 1 + i,
              is_main: attachments.length === 0 && i === 0,
            })
            .select()
            .single();
          if (dbError) {
            await supabase.storage.from("attachments").remove([path]);
            throw dbError;
          }
          return att;
        })
      );

      const uploaded = results
        .filter((r): r is PromiseFulfilledResult<Attachment> => r.status === "fulfilled" && r.value != null)
        .map((r) => r.value);
      const errorCount = results.filter((r) => r.status === "rejected").length;

      if (uploaded.length > 0) {
        setAttachments((prev) => [...prev, ...uploaded]);
        toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} ajoutee${uploaded.length > 1 ? "s" : ""}`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} photo${errorCount > 1 ? "s" : ""} en erreur`);
      }
      router.refresh();
    } catch (err) {
      toast.error("Erreur lors de l'upload");
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(att: Attachment) {
    try {
      await supabase.storage.from("attachments").remove([att.storage_path]);
      await supabase.from("attachments").delete().eq("id", att.id);
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      toast.success("Photo supprimee");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  // ── Caption editing ──────────────────────────────────────────

  function startEditCaption(att: Attachment) {
    setEditingCaption(att.id);
    setCaptionValue(att.caption || "");
    setTimeout(() => captionInputRef.current?.focus(), 50);
  }

  async function saveCaption(attId: string) {
    setSavingCaption(true);
    try {
      const result = await updateAttachmentCaption(attId, captionValue);
      if (result.success) {
        setAttachments((prev) =>
          prev.map((a) => (a.id === attId ? { ...a, caption: captionValue || null } : a))
        );
        toast.success("Legende mise a jour");
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSavingCaption(false);
      setEditingCaption(null);
    }
  }

  // ── Set as main ──────────────────────────────────────────────

  async function handleSetMain(att: Attachment) {
    if (att.is_main) return;
    setSettingMain(att.id);
    try {
      const result = await setAttachmentAsMain(att.id, entityType, entityId);
      if (result.success) {
        setAttachments((prev) =>
          prev.map((a) => ({
            ...a,
            is_main: a.id === att.id,
          }))
        );
        toast.success("Photo principale definie");
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setSettingMain(null);
    }
  }

  // ── Drag & drop reorder ──────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, attId: string) => {
    setDraggedId(attId);
    e.dataTransfer.effectAllowed = "move";
    // Set a transparent drag image
    const elem = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(elem, elem.offsetWidth / 2, elem.offsetHeight / 2);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, attId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (attId !== draggedId) {
      setDragOverId(attId);
    }
  }, [draggedId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragOverId(null);

      if (!draggedId || draggedId === targetId) {
        setDraggedId(null);
        return;
      }

      const oldIndex = attachments.findIndex((a) => a.id === draggedId);
      const newIndex = attachments.findIndex((a) => a.id === targetId);
      if (oldIndex === -1 || newIndex === -1) {
        setDraggedId(null);
        return;
      }

      // Reorder in state
      const newOrder = [...attachments];
      const [moved] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, moved);

      // Update positions
      const withPositions = newOrder.map((a, i) => ({ ...a, position: i }));
      setAttachments(withPositions);
      setDraggedId(null);

      // Persist to server
      const updates = withPositions.map((a) => ({ id: a.id, position: a.position }));
      const result = await updateAttachmentPositions(updates);
      if (!result.success) {
        toast.error(result.error || "Erreur lors du reordonnancement");
        // Revert
        setAttachments(attachments);
      }
    },
    [draggedId, attachments]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>
          {title} ({attachments.length})
        </CardTitle>
        {canUpload && (
          <label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
              <span className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4 mr-2" />
                )}
                Ajouter photo
              </span>
            </Button>
          </label>
        )}
      </CardHeader>
      <CardContent>
        {attachments.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {attachments.map((att) => (
              <div
                key={att.id}
                draggable={canUpload}
                onDragStart={(e) => handleDragStart(e, att.id)}
                onDragOver={(e) => handleDragOver(e, att.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, att.id)}
                onDragEnd={handleDragEnd}
                className={`relative group rounded-lg overflow-hidden border bg-muted transition-all ${
                  draggedId === att.id ? "opacity-50 scale-95" : ""
                } ${dragOverId === att.id ? "ring-2 ring-primary" : ""}`}
              >
                {/* Main photo badge */}
                {att.is_main && (
                  <div className="absolute top-1 left-1 z-10 bg-amber-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Principale
                  </div>
                )}

                {/* Drag handle */}
                {canUpload && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-white drop-shadow-md" />
                  </div>
                )}

                {/* Image */}
                <div className="aspect-square">
                  <img
                    src={`/api/storage/${att.storage_path}`}
                    alt={att.caption || ""}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>

                {/* Overlay actions */}
                <div className="absolute top-1 right-1 flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                  {/* Set as main button */}
                  {canUpload && !att.is_main && (
                    <button
                      onClick={() => handleSetMain(att)}
                      disabled={settingMain === att.id}
                      className="relative h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-amber-500 transition-colors after:content-[''] after:absolute after:-inset-1"
                      aria-label="Definir comme photo principale"
                      title="Definir comme photo principale"
                    >
                      {settingMain === att.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Star className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}

                  {/* Delete button */}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(att)}
                      className="relative h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors after:content-[''] after:absolute after:-inset-1"
                      aria-label="Supprimer la photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Caption area */}
                {canUpload ? (
                  <div className="p-1.5">
                    {editingCaption === att.id ? (
                      <div className="flex gap-1">
                        <input
                          ref={captionInputRef}
                          type="text"
                          value={captionValue}
                          onChange={(e) => setCaptionValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveCaption(att.id);
                            if (e.key === "Escape") setEditingCaption(null);
                          }}
                          placeholder="Legende..."
                          className="flex-1 text-xs bg-background border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                          maxLength={500}
                          disabled={savingCaption}
                        />
                        <button
                          onClick={() => saveCaption(att.id)}
                          disabled={savingCaption}
                          className="text-primary hover:text-primary/80 flex-shrink-0"
                        >
                          {savingCaption ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditCaption(att)}
                        className="w-full text-left text-xs text-muted-foreground hover:text-foreground truncate transition-colors"
                        title={att.caption || "Ajouter une legende"}
                      >
                        {att.caption || "Ajouter une legende..."}
                      </button>
                    )}
                  </div>
                ) : att.caption ? (
                  <div className="p-1.5">
                    <p className="text-xs text-muted-foreground truncate" title={att.caption}>
                      {att.caption}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune photo</p>
        )}
      </CardContent>
    </Card>
  );
}
