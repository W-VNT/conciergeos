import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded" />
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
