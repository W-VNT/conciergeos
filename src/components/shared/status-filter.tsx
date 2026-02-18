"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface StatusFilterProps {
  paramName?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function StatusFilter({
  paramName = "status",
  options,
  placeholder = "Tous les statuts",
}: StatusFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <Select
      defaultValue={searchParams.get(paramName) ?? "ALL"}
      onValueChange={handleFilter}
    >
      <SelectTrigger className="w-full sm:w-auto sm:min-w-36">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{placeholder}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
