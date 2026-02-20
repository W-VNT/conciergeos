"use client";

import { useState } from "react";

interface UseBulkSelectionOptions<T extends { id: string }> {
  items: T[];
}

export function useBulkSelection<T extends { id: string }>({ items }: UseBulkSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === items.length ? [] : items.map((item) => item.id)
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  const isAllSelected = selectedIds.length === items.length && items.length > 0;

  return {
    selectedIds,
    toggleSelection,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    selectedCount: selectedIds.length,
  };
}
