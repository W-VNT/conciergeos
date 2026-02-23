import { Card, CardContent } from "@/components/ui/card";

export default function IncidentDetailLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-muted rounded" />
        <div className="h-9 w-24 bg-muted rounded" />
      </div>
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted rounded-full" />
            <div className="h-6 w-20 bg-muted rounded-full" />
          </div>
          <div className="h-20 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
