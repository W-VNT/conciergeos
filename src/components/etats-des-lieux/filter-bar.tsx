"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  logements: Array<{ id: string; name: string }>;
  currentLogement?: string;
  currentType?: string;
}

export function FilterBar({
  logements,
  currentLogement,
  currentType,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
      <Select
        value={currentLogement ?? "ALL"}
        onValueChange={(v) => updateParam("logement", v)}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Tous les logements" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tous les logements</SelectItem>
          {logements.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentType ?? "ALL"}
        onValueChange={(v) => updateParam("type", v)}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Tous les types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tous les types</SelectItem>
          <SelectItem value="ENTREE">Entrée</SelectItem>
          <SelectItem value="SORTIE">Sortie</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
