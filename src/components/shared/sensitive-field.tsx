"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface SensitiveFieldProps {
  value: string;
  className?: string;
}

export function SensitiveField({ value, className }: SensitiveFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="inline-flex items-center gap-1">
      <code className={className}>
        {visible ? value : "••••••"}
      </code>
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={visible ? "Masquer" : "Afficher"}
      >
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}
