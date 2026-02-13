"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUpload } from "./photo-upload";
import type { EntityType, Attachment } from "@/types/database";
import { useRouter } from "next/navigation";

interface Props {
  organisationId: string;
  entityType: EntityType;
  entityId: string;
  initialAttachments: Attachment[];
  canUpload: boolean;
  canDelete: boolean;
}

export function PhotoSection({
  organisationId,
  entityType,
  entityId,
  initialAttachments,
  canUpload,
  canDelete,
}: Props) {
  const router = useRouter();

  function handleChange() {
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos ({initialAttachments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {canUpload ? (
          <PhotoUpload
            organisationId={organisationId}
            entityType={entityType}
            entityId={entityId}
            attachments={initialAttachments}
            onUpload={handleChange}
            canDelete={canDelete}
          />
        ) : (
          initialAttachments.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {initialAttachments.map((att) => (
                <div key={att.id} className="aspect-square rounded-lg overflow-hidden border bg-gray-100">
                  <img
                    src={`/api/storage/${encodeURIComponent(att.storage_path)}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune photo</p>
          )
        )}
      </CardContent>
    </Card>
  );
}
