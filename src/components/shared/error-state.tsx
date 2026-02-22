"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorState({ error, reset }: ErrorStateProps) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="flex flex-col items-center text-center py-12">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold mb-1">
            Une erreur est survenue
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Impossible de charger cette page. Veuillez réessayer.
          </p>
          <Button onClick={reset} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
