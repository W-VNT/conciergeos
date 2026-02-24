"use client";

import { useState, useEffect, useRef } from "react";
import {
  sendAdminOwnerMessage,
  getAdminOwnerMessages,
} from "@/lib/actions/owner-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { OwnerMessage } from "@/types/database";
import { cn } from "@/lib/utils";

interface AdminOwnerMessagesProps {
  proprietaireId: string;
  organisationId: string;
  initialMessages?: OwnerMessage[];
}

export function AdminOwnerMessages({
  proprietaireId,
  organisationId,
  initialMessages,
}: AdminOwnerMessagesProps) {
  const [messages, setMessages] = useState<OwnerMessage[]>(initialMessages ?? []);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(!initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages if not provided
  useEffect(() => {
    if (!initialMessages) {
      getAdminOwnerMessages(proprietaireId)
        .then((msgs) => setMessages(msgs))
        .catch(() => toast.error("Erreur lors du chargement des messages"))
        .finally(() => setLoading(false));
    }
  }, [proprietaireId, initialMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const result = await sendAdminOwnerMessage(proprietaireId, trimmed);
      if (result.success) {
        setContent("");
        toast.success("Message envoye");
        // Reload messages
        const updated = await getAdminOwnerMessages(proprietaireId);
        setMessages(updated);
      } else {
        toast.error(result.error ?? "Erreur");
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-5 w-5" />
          Messages avec le proprietaire
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col pb-4">
        {/* Messages thread */}
        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1 mb-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Aucun message. Ecrivez votre premier message ci-dessous.
            </div>
          ) : (
            messages.map((msg) => {
              const isAdmin = msg.sender_type === "ADMIN";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    isAdmin ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2",
                      isAdmin
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div
                      className={cn(
                        "flex items-center gap-1 mt-1",
                        isAdmin ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.sender && (
                        <span
                          className={cn(
                            "text-[10px]",
                            isAdmin
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {msg.sender.full_name}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[10px]",
                          isAdmin
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        &middot;{" "}
                        {format(new Date(msg.created_at), "d MMM HH:mm", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center gap-2 flex-shrink-0">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ecrivez votre message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !content.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
