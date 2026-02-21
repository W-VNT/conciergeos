"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface ChipFilterProps {
  paramName?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function ChipFilter({
  paramName = "status",
  options,
  placeholder = "Tous",
}: ChipFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get(paramName) ?? "ALL";

  const handleFilter = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "ALL") {
        params.delete(paramName);
      } else {
        params.set(paramName, value);
      }
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams, paramName]
  );

  const allOptions = [{ value: "ALL", label: placeholder }, ...options];

  return (
    <div className="flex overflow-x-auto gap-2 no-scrollbar">
      {allOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleFilter(opt.value)}
          className={cn(
            "whitespace-nowrap rounded-full px-3 min-h-[36px] text-sm font-medium transition-colors shrink-0",
            currentValue === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
