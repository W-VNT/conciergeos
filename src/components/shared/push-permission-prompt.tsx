"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushPermissionPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if push is supported
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    // Already granted or denied
    if (Notification.permission !== "default") return;

    // Already dismissed
    if (localStorage.getItem("push-prompt-dismissed")) return;

    // Wait a bit before showing (don't overwhelm on first load)
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = async () => {
    setVisible(false);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        localStorage.setItem("push-prompt-dismissed", "1");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ) as BufferSource,
      });

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
    } catch (err) {
      console.error("[push] Subscription failed:", err);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("push-prompt-dismissed", "1");
  };

  if (!visible) return null;

  return (
    <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg border bg-card p-3 shadow-sm animate-in slide-in-from-top-2 duration-300">
      <Bell className="h-4 w-4 text-primary flex-shrink-0" />
      <p className="text-sm flex-1">Activer les notifications push ?</p>
      <Button size="sm" variant="default" onClick={handleAccept} className="h-7 px-3 text-xs">
        Activer
      </Button>
      <button
        onClick={handleDismiss}
        className="h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
