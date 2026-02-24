"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Hook that subscribes to realtime INSERT events on the notifications table
 * for the given user. Returns the latest notification received and
 * a cumulative count of new notifications since mounting.
 */
export function useRealtimeNotifications(userId: string) {
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);
  const [newCount, setNewCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const resetCount = useCallback(() => {
    setNewCount(0);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setLatestNotification(newNotification);
          setNewCount((prev) => prev + 1);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId]);

  return { latestNotification, newCount, resetCount };
}
