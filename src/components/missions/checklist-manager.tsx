"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, ListChecks, Camera, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { MissionChecklistItem } from "@/types/database";
import { getMissionChecklist, toggleChecklistItem, updateChecklistItem } from "@/lib/actions/checklists";

interface Props {
  missionId: string;
}

export function ChecklistManager({ missionId }: Props) {
  const [items, setItems] = useState<MissionChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Photo modal state
  const [photoModalItem, setPhotoModalItem] = useState<MissionChecklistItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChecklist();
  }, [missionId]);

  async function loadChecklist() {
    setLoading(true);
    const result = await getMissionChecklist(missionId);
    if (result.items) setItems(result.items);
    setLoading(false);
  }

  async function handleToggle(item: MissionChecklistItem) {
    // Si l'item requiert une photo et qu'on veut le compléter → ouvrir la modal
    if (item.item?.photo_requise && !item.completed) {
      setPhotoModalItem(item);
      setPreviewUrl(null);
      setSelectedFile(null);
      return;
    }

    // Sinon toggle direct
    const result = await toggleChecklistItem(item.id, !item.completed);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(item.completed ? "Tâche marquée non complétée" : "Tâche complétée");
      loadChecklist();
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function handlePhotoUpload() {
    if (!photoModalItem || !selectedFile) return;
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = selectedFile.name.split(".").pop() ?? "jpg";
      const path = `checklist/${missionId}/${photoModalItem.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, selectedFile);

      if (uploadError) throw uploadError;

      // Stocker le storage path dans photo_url
      const updateResult = await updateChecklistItem(photoModalItem.id, { photo_url: path });
      if (updateResult.error) throw new Error(updateResult.error);

      // Marquer complété
      const toggleResult = await toggleChecklistItem(photoModalItem.id, false);
      if (toggleResult.error) throw new Error(toggleResult.error);

      toast.success("Photo ajoutée — tâche complétée");
      closePhotoModal();
      loadChecklist();
    } catch (err) {
      toast.error("Erreur lors de l'upload");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleCompleteWithoutPhoto() {
    if (!photoModalItem) return;
    const result = await toggleChecklistItem(photoModalItem.id, true);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Tâche complétée");
      closePhotoModal();
      loadChecklist();
    }
  }

  function closePhotoModal() {
    setPhotoModalItem(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement de la checklist…
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Aucune checklist associée à cette mission
          </p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = items.filter((i) => i.completed).length;
  const progress = Math.round((completedCount / items.length) * 100);

  const grouped = items.reduce((acc, item) => {
    const cat = item.item?.categorie || "Autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MissionChecklistItem[]>);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Checklist
              </CardTitle>
              <CardDescription>
                {completedCount} / {items.length} tâches complétées ({progress}%)
              </CardDescription>
            </div>
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {progress}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Items groupés par catégorie */}
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                      item.completed ? "bg-muted/30" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => handleToggle(item)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={item.completed ? "line-through text-muted-foreground" : "font-medium"}>
                          {item.item?.titre}
                        </span>
                        {item.item?.photo_requise && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            <Camera className="h-3 w-3" />
                            Photo
                          </span>
                        )}
                        {item.completed && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                      </div>
                      {item.notes && (
                        <p className="text-sm text-blue-600 mt-1 italic">Note : {item.notes}</p>
                      )}
                      {/* Miniature de la photo si présente */}
                      {item.photo_url && (
                        <div className="mt-2">
                          <img
                            src={`/api/storage/${encodeURIComponent(item.photo_url)}`}
                            alt="Photo"
                            className="h-16 w-16 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Modal photo */}
      <Dialog open={!!photoModalItem} onOpenChange={(open) => { if (!open) closePhotoModal(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-amber-600" />
              Photo requise
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cette tâche requiert une photo de preuve :{" "}
              <span className="font-medium text-foreground">{photoModalItem?.item?.titre}</span>
            </p>

            {/* Zone de sélection / preview */}
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Aperçu"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => { setPreviewUrl(null); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Prendre une photo ou choisir depuis la galerie</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Button
                onClick={handlePhotoUpload}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Upload en cours…</>
                ) : (
                  <><Camera className="h-4 w-4 mr-2" /> Valider avec la photo</>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCompleteWithoutPhoto}
                disabled={uploading}
                className="text-muted-foreground"
              >
                Compléter sans photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
