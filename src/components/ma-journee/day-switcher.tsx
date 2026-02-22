"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentDate: string; // YYYY-MM-DD
  formattedDate: string; // "lundi 22 février"
  isToday: boolean;
}

export function DaySwitcher({ currentDate, formattedDate, isToday }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(offset: number) {
    const date = new Date(currentDate + "T00:00:00");
    date.setDate(date.getDate() + offset);
    const iso = date.toISOString().split("T")[0];

    const params = new URLSearchParams(searchParams.toString());
    // If navigating to today, remove the param for a clean URL
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().split("T")[0];
    if (iso === todayIso) {
      params.delete("date");
    } else {
      params.set("date", iso);
    }

    const qs = params.toString();
    router.push(`/ma-journee${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <button
        onClick={() => {
          if (!isToday) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("date");
            const qs = params.toString();
            router.push(`/ma-journee${qs ? `?${qs}` : ""}`);
          }
        }}
        className={`text-sm capitalize ${isToday ? "text-muted-foreground" : "text-primary hover:underline cursor-pointer"}`}
      >
        {isToday ? formattedDate : formattedDate}
      </button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isToday && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("date");
            const qs = params.toString();
            router.push(`/ma-journee${qs ? `?${qs}` : ""}`);
          }}
        >
          Aujourd&apos;hui
        </Button>
      )}
    </div>
  );
}
