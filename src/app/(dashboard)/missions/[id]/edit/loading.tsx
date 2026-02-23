export default function EditMissionLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="space-y-4 border rounded-lg p-6">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
        <div className="h-10 bg-muted rounded" />
        <div className="h-24 bg-muted rounded" />
        <div className="h-10 w-32 bg-muted rounded ml-auto" />
      </div>
    </div>
  );
}
