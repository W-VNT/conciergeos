"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function FinancesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} />;
}
