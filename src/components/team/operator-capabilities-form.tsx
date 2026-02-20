"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MISSION_TYPE_LABELS, type MissionType } from "@/types/database";
import { updateOperatorCapabilities } from "@/lib/actions/missions";
import { toast } from "sonner";

interface Props {
  operatorId: string;
  initialCapabilities?: {
    mission_types: MissionType[];
    zones: string[];
  };
  onSuccess?: () => void;
}

export function OperatorCapabilitiesForm({
  operatorId,
  initialCapabilities,
  onSuccess,
}: Props) {
  const [missionTypes, setMissionTypes] = useState<MissionType[]>(
    initialCapabilities?.mission_types || []
  );
  const [zones, setZones] = useState<string[]>(
    initialCapabilities?.zones || []
  );
  const [newZone, setNewZone] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleMissionType = (type: MissionType) => {
    setMissionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const addZone = () => {
    if (newZone && !zones.includes(newZone)) {
      setZones([...zones, newZone]);
      setNewZone("");
    }
  };

  const removeZone = (zone: string) => {
    setZones(zones.filter((z) => z !== zone));
  };

  const handleSave = async () => {
    setLoading(true);

    const capabilitiesToSave = {
      mission_types: missionTypes,
      zones,
    };

    console.log("Saving capabilities:", capabilitiesToSave);

    const result = await updateOperatorCapabilities(operatorId, capabilitiesToSave);

    console.log("Save result:", result);

    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  };

  const missionTypeOptions: MissionType[] = [
    "CHECKIN",
    "CHECKOUT",
    "MENAGE",
    "INTERVENTION",
    "URGENCE",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Types de missions</h3>
        <div className="space-y-2">
          {missionTypeOptions.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={type}
                checked={missionTypes.includes(type)}
                onCheckedChange={() => toggleMissionType(type)}
              />
              <Label htmlFor={type} className="cursor-pointer">
                {MISSION_TYPE_LABELS[type]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Zones géographiques</h3>
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Code postal (ex: 06000)"
            value={newZone}
            onChange={(e) => setNewZone(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addZone()}
          />
          <Button type="button" onClick={addZone} variant="outline">
            Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {zones.map((zone) => (
            <div
              key={zone}
              className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full"
            >
              <span className="text-sm">{zone}</span>
              <button
                type="button"
                onClick={() => removeZone(zone)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading}>
        Enregistrer les compétences
      </Button>
    </div>
  );
}
