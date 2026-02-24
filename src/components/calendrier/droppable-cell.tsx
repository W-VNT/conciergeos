"use client";

import { useDroppable } from "@dnd-kit/core";

interface DroppableCellProps {
  /** ISO datetime string identifying this time slot (e.g. "2026-02-24T09:00:00") */
  dateTime: string;
  children: React.ReactNode;
  className?: string;
}

export function DroppableCell({
  dateTime,
  children,
  className = "",
}: DroppableCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: dateTime,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} transition-colors ${
        isOver ? "bg-primary/10 ring-1 ring-primary/30 ring-inset" : ""
      }`}
    >
      {children}
    </div>
  );
}
