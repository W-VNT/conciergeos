"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { EntityType, Attachment } from "@/types/database";

interface PhotoUploadProps {
  organisationId: string;
  entityType: EntityType;
  entityId: string;
  attachments: Attachment[];
  onUpload?: () => void;
  canDelete?: boolean;
}

export function PhotoUpload({
  organisationId,
  entityType,
  entityId,
  attachments,
  onUpload,
  canDelete = true,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${organisationId}/${entityType}/${entityId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("attachments").insert({
          organisation_id: organisationId,
          entity_type: entityType,
          entity_id: entityId,
          storage_path: path,
          mime_type: file.type,
        });

        if (dbError) throw dbError;
      }
      toast.success("Photo(s) ajoutée(s)");
      onUpload?.();
    } catch (err) {
      toast.error("Erreur lors de l'upload");
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(attachment: Attachment) {
    try {
      await supabase.storage.from("attachments").remove([attachment.storage_path]);
      await supabase.from("attachments").delete().eq("id", attachment.id);
      toast.success("Photo supprimée");
      onUpload?.();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
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
      </div>
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {attachments.map((att) => (
            <div key={att.id} className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-100">
              <img
                src={`/api/storage/${encodeURIComponent(att.storage_path)}`}
                alt=""
                className="w-full h-full object-cover"
              />
              {canDelete && (
                <button
                  onClick={() => handleDelete(att)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity after:content-[''] after:absolute after:-inset-[10px]"
                  aria-label="Supprimer la photo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
