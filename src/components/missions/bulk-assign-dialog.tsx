"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { bulkAssignMissions } from "@/lib/actions/missions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Operator {
  id: string;
  full_name: string;
  email: string;
  role: "ADMIN" | "OPERATEUR";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionIds: string[];
  organisationId: string;
  onSuccess: () => void;
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  missionIds,
  organisationId,
  onSuccess,
}: Props) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadOperators();
    }
  }, [open]);

  const loadOperators = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["OPERATEUR", "ADMIN"])
      .eq("organisation_id", organisationId)
      .order("full_name");

    setOperators(data || []);
  };

  const handleAssign = async () => {
    if (!selectedOperator) return;

    setLoading(true);

    const result = await bulkAssignMissions({
      mission_ids: missionIds,
      operator_id: selectedOperator,
    });

    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Assigner {missionIds.length} mission{missionIds.length > 1 ? "s" : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={selectedOperator} onValueChange={setSelectedOperator}>
            {operators.map((operator) => (
              <div key={operator.id} className="flex items-center space-x-2">
                <RadioGroupItem value={operator.id} id={operator.id} />
                <Label htmlFor={operator.id} className="flex-1 cursor-pointer flex items-center gap-2">
                  <span>{operator.full_name}</span>
                  {operator.role === "ADMIN" && (
                    <span className="text-xs text-muted-foreground">(Admin)</span>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {operators.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun membre disponible
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedOperator || loading}
            >
              Assigner
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
