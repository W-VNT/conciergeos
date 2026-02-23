import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function FinancesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded" />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-4 w-24 bg-muted rounded mb-2" />
              <div className="h-8 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
