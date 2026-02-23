"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Analytics error:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">
            Une erreur est survenue lors du chargement des analytics.
          </p>
          <Button onClick={reset} variant="outline">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
