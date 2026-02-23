import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center py-12">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileQuestion className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Page introuvable</h2>
          <p className="text-sm text-muted-foreground mb-6">
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </p>
          <Button asChild>
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
