"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface LiveTimerProps {
  startedAt: string;
}

export function LiveTimer({ startedAt }: LiveTimerProps) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    function update() {
      const diff = Date.now() - new Date(startedAt).getTime();
      if (diff < 0) {
        setElapsed("00:00:00");
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setElapsed(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1">
      <Clock className="h-3.5 w-3.5 text-blue-600" />
      <span className="font-mono text-sm text-blue-700 tabular-nums">
        {elapsed}
      </span>
    </div>
  );
}
