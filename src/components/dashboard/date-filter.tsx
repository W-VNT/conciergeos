"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

export type DateRange = "7d" | "30d" | "90d" | "custom";

interface Props {
  className?: string;
}

export function DateFilter({ className }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = (searchParams.get("range") as DateRange) || "30d";
  const customStart = searchParams.get("start");
  const customEnd = searchParams.get("end");

  const [startDate, setStartDate] = useState(customStart || "");
  const [endDate, setEndDate] = useState(customEnd || "");

  function handleRangeChange(range: DateRange) {
    const params = new URLSearchParams(searchParams);

    if (range === "custom") {
      params.set("range", "custom");
      // Keep existing custom dates if any
    } else {
      params.set("range", range);
      params.delete("start");
      params.delete("end");
    }

    router.push(`?${params.toString()}`);
  }

  function applyCustomRange() {
    if (!startDate || !endDate) return;

    const params = new URLSearchParams(searchParams);
    params.set("range", "custom");
    params.set("start", startDate);
    params.set("end", endDate);

    router.push(`?${params.toString()}`);
  }

  function formatDisplayRange() {
    if (customStart && customEnd) {
      const start = new Date(customStart).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      const end = new Date(customEnd).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      return `${start} - ${end}`;
    }
    return "Sélectionner";
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={currentRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">7 derniers jours</SelectItem>
          <SelectItem value="30d">30 derniers jours</SelectItem>
          <SelectItem value="90d">90 derniers jours</SelectItem>
          <SelectItem value="custom">Personnalisé</SelectItem>
        </SelectContent>
      </Select>

      {currentRange === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {formatDisplayRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de début</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de fin</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
              <Button
                onClick={applyCustomRange}
                disabled={!startDate || !endDate}
                className="w-full"
                size="sm"
              >
                Appliquer
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
