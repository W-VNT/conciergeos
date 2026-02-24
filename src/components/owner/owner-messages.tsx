"use client";

import { useState, useEffect, useRef } from "react";
import { sendOwnerMessage, markOwnerMessagesRead } from "@/lib/actions/owner-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { OwnerMessage } from "@/types/database";
import { cn } from "@/lib/utils";

interface OwnerMessagesProps {
  messages: OwnerMessage[];
  proprietaireId: string;
}

export function OwnerMessages({ messages: initialMessages, proprietaireId }: OwnerMessagesProps) {
  const [messages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark messages as read on mount
  useEffect(() => {
    const hasUnread = messages.some(
      (m) => m.sender_type === "ADMIN" && !m.read_at
    );
    if (hasUnread) {
      markOwnerMessagesRead();
    }
  }, [messages]);

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
      const result = await sendOwnerMessage(trimmed);
      if (result.success) {
        setContent("");
        toast.success("Message envoye");
      } else {
        toast.error(result.error ?? "Erreur");
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages avec l'administration
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0 pb-4">
        {/* Messages thread */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Aucun message. Ecrivez votre premier message ci-dessous.
            </div>
          ) : (
            messages.map((msg) => {
              const isOwner = msg.sender_type === "OWNER";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    isOwner ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2",
                      isOwner
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div
                      className={cn(
                        "flex items-center gap-1 mt-1",
                        isOwner ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.sender && (
                        <span
                          className={cn(
                            "text-[10px]",
                            isOwner
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
                          isOwner
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
