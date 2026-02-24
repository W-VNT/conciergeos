"use client";

import { useState, useOptimistic, useTransition, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment } from "@/lib/actions/mission-comments";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { MissionComment } from "@/types/database";

interface CommentsSectionProps {
  missionId: string;
  initialComments: MissionComment[];
  currentUserName: string;
}

export function CommentsSection({
  missionId,
  initialComments,
  currentUserName,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<MissionComment[]>(initialComments);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state: MissionComment[], newComment: MissionComment) => [...state, newComment]
  );

  const handleSubmit = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const optimisticComment: MissionComment = {
      id: `temp-${Date.now()}`,
      organisation_id: "",
      mission_id: missionId,
      author_id: "",
      content: trimmedContent,
      created_at: new Date().toISOString(),
      author: { full_name: currentUserName } as MissionComment["author"],
    };

    setContent("");

    startTransition(async () => {
      addOptimisticComment(optimisticComment);

      const result = await addComment({
        mission_id: missionId,
        content: trimmedContent,
      });

      if (result.success && result.data) {
        setComments((prev) => [...prev, result.data!]);
      } else {
        toast.error(result.error ?? "Erreur lors de l'envoi du commentaire");
        // Restore the content on error
        setContent(trimmedContent);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Commentaires
          {optimisticComments.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              ({optimisticComments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments list */}
        {optimisticComments.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {optimisticComments.map((comment) => {
              const author = Array.isArray(comment.author)
                ? comment.author[0]
                : comment.author;
              const isOptimistic = comment.id.startsWith("temp-");

              return (
                <div
                  key={comment.id}
                  className={`text-sm space-y-1 ${isOptimistic ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {author?.full_name ?? "Inconnu"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {comment.content}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun commentaire pour le moment.
          </p>
        )}

        {/* Comment input */}
        <div className="flex flex-col gap-2 pt-2 border-t">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ajouter un commentaire..."
            rows={2}
            className="resize-none"
            disabled={isPending}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Ctrl+Entrer pour envoyer
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isPending || !content.trim()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              Envoyer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
