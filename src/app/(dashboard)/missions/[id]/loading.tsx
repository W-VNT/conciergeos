import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function MissionDetailLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-muted rounded" />
        <div className="h-9 w-24 bg-muted rounded" />
      </div>
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-muted rounded" />
              <div className="h-4 w-56 bg-muted rounded" />
            </div>
            <div className="space-y-1 text-right">
              <div className="h-4 w-16 bg-muted rounded ml-auto" />
              <div className="h-3 w-12 bg-muted rounded ml-auto" />
            </div>
          </div>
          <div className="h-4 w-32 bg-muted rounded" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-5 w-24 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </CardContent>
      </Card>
    </div>
  );
}
