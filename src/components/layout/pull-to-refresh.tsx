"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const THRESHOLD = 80;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (window.scrollY === 0 && !refreshing) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    },
    [refreshing]
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.4, THRESHOLD + 20));
      setPulling(true);
    } else {
      isPulling.current = false;
      setPulling(false);
      setPullDistance(0);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.5);
      router.refresh();
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
        setPulling(false);
      }, 800);
    } else {
      setPullDistance(0);
      setPulling(false);
    }
  }, [pullDistance, router]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200 md:hidden"
        style={{ height: pulling || refreshing ? pullDistance : 0 }}
      >
        <Loader2
          className={`h-5 w-5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`}
          style={{
            opacity: Math.min(pullDistance / THRESHOLD, 1),
            transform: refreshing
              ? undefined
              : `rotate(${(pullDistance / THRESHOLD) * 360}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}
