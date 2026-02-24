"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Variable } from "lucide-react";
import { useState } from "react";

const VARIABLE_GROUPS = [
  {
    label: "Voyageur",
    variables: [
      { key: "{{guest_name}}", label: "Nom du voyageur" },
      { key: "{{guest_email}}", label: "Email du voyageur" },
      { key: "{{guest_phone}}", label: "Téléphone du voyageur" },
    ],
  },
  {
    label: "Réservation",
    variables: [
      { key: "{{check_in_date}}", label: "Date d'arrivée" },
      { key: "{{check_out_date}}", label: "Date de départ" },
      { key: "{{check_in_time}}", label: "Heure d'arrivée" },
      { key: "{{check_out_time}}", label: "Heure de départ" },
      { key: "{{amount}}", label: "Montant" },
      { key: "{{platform}}", label: "Plateforme" },
    ],
  },
  {
    label: "Logement",
    variables: [
      { key: "{{logement_name}}", label: "Nom du logement" },
      { key: "{{logement_address}}", label: "Adresse du logement" },
      { key: "{{wifi_name}}", label: "Nom WiFi" },
      { key: "{{wifi_password}}", label: "Mot de passe WiFi" },
      { key: "{{lockbox_code}}", label: "Code boîte à clés" },
    ],
  },
  {
    label: "Organisation",
    variables: [
      { key: "{{org_name}}", label: "Nom de l'organisation" },
      { key: "{{org_phone}}", label: "Téléphone de l'organisation" },
      { key: "{{org_email}}", label: "Email de l'organisation" },
    ],
  },
  {
    label: "Propriétaire",
    variables: [
      { key: "{{owner_name}}", label: "Nom du propriétaire" },
      { key: "{{owner_email}}", label: "Email du propriétaire" },
    ],
  },
  {
    label: "Opérateur",
    variables: [
      { key: "{{operator_name}}", label: "Nom de l'opérateur" },
    ],
  },
];

interface VariablePickerProps {
  onInsert: (variable: string) => void;
}

export function VariablePicker({ onInsert }: VariablePickerProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(variable: string) {
    onInsert(variable);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Variable className="h-4 w-4 mr-1.5" />
          Variables
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[400px] overflow-y-auto p-0" align="start">
        <div className="p-3 border-b">
          <p className="text-sm font-medium">Insérer une variable</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cliquez sur une variable pour l&apos;insérer dans le message.
          </p>
        </div>
        <div className="p-2 space-y-3">
          {VARIABLE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-1">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.variables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => handleSelect(v.key)}
                    className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-muted-foreground">{v.label}</span>
                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                      {v.key}
                    </code>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
