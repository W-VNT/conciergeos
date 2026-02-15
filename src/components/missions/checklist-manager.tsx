"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { toast } from "sonner";
import type { MissionChecklistItem } from "@/types/database";
import { getMissionChecklist, toggleChecklistItem } from "@/lib/actions/checklists";

interface Props {
  missionId: string;
}

export function ChecklistManager({ missionId }: Props) {
  const [items, setItems] = useState<MissionChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklist();
  }, [missionId]);

  async function loadChecklist() {
    setLoading(true);
    const result = await getMissionChecklist(missionId);
    if (result.items) {
      setItems(result.items);
    }
    setLoading(false);
  }

  async function handleToggle(itemId: string, completed: boolean) {
    const result = await toggleChecklistItem(itemId, !completed);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(completed ? "Tâche marquée non complétée" : "Tâche complétée");
      loadChecklist();
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement de la checklist...
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Aucune checklist associée à cette mission
          </p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = items.filter((i) => i.completed).length;
  const progress = Math.round((completedCount / items.length) * 100);

  // Group by category
  const grouped = items.reduce((acc, item) => {
    const cat = item.item?.categorie || "Autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MissionChecklistItem[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Checklist
            </CardTitle>
            <CardDescription>
              {completedCount} / {items.length} tâches complétées ({progress}%)
            </CardDescription>
          </div>
          <Badge variant={progress === 100 ? "default" : "secondary"}>
            {progress}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Items grouped by category */}
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase">
              {category}
            </h3>
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                    item.completed ? "bg-muted/30" : ""
                  }`}
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => handleToggle(item.id, item.completed)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={item.completed ? "line-through text-muted-foreground" : "font-medium"}>
                        {item.item?.titre}
                      </span>
                      {item.completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                    {item.item?.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.item.description}</p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-blue-600 mt-1 italic">Note: {item.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
