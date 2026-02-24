"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortableHeaderProps {
  label: string;
  column: string;
  className?: string;
}

export function SortableHeader({ label, column, className }: SortableHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort");
  const currentOrder = searchParams.get("order") || "asc";
  const isActive = currentSort === column;

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    if (isActive && currentOrder === "asc") {
      params.set("order", "desc");
    } else if (isActive && currentOrder === "desc") {
      params.delete("sort");
      params.delete("order");
    } else {
      params.set("sort", column);
      params.set("order", "asc");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const Icon = isActive ? (currentOrder === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} className={className}>
      {label}
      <Icon className="ml-1 h-3 w-3" />
    </Button>
  );
}
