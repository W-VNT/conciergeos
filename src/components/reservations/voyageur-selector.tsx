"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface VoyageurOption {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
}

interface VoyageurSelectorProps {
  value: string | null;
  onChange: (voyageurId: string | null, voyageur?: VoyageurOption) => void;
  organisationId: string;
}

export function VoyageurSelector({ value, onChange, organisationId }: VoyageurSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [voyageurs, setVoyageurs] = useState<VoyageurOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>("");

  const fetchVoyageurs = useCallback(
    async (searchTerm: string) => {
      setLoading(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from("voyageurs")
          .select("id, full_name, email, phone")
          .eq("organisation_id", organisationId)
          .order("full_name")
          .limit(20);

        if (searchTerm) {
          const sanitized = searchTerm.replace(/%/g, "\\%").replace(/_/g, "\\_");
          query = query.or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
        }

        const { data } = await query;
        setVoyageurs(data ?? []);
      } catch {
        setVoyageurs([]);
      } finally {
        setLoading(false);
      }
    },
    [organisationId]
  );

  // Fetch on open and on search change
  useEffect(() => {
    if (open) {
      fetchVoyageurs(search);
    }
  }, [open, search, fetchVoyageurs]);

  // Resolve selected label
  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      return;
    }
    const found = voyageurs.find((v) => v.id === value);
    if (found) {
      setSelectedLabel(found.full_name);
    } else {
      // Fetch the selected voyageur to get the label
      const supabase = createClient();
      supabase
        .from("voyageurs")
        .select("full_name")
        .eq("id", value)
        .single()
        .then(({ data }) => {
          if (data) setSelectedLabel(data.full_name);
        });
    }
  }, [value, voyageurs]);

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedLabel || "Sélectionner un voyageur..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher par nom ou email..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Chargement...
                </div>
              ) : (
                <>
                  <CommandEmpty>Aucun voyageur trouvé</CommandEmpty>
                  <CommandGroup>
                    {voyageurs.map((v) => (
                      <CommandItem
                        key={v.id}
                        value={v.id}
                        onSelect={() => {
                          onChange(v.id, v);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === v.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{v.full_name}</span>
                          {v.email && (
                            <span className="text-xs text-muted-foreground">{v.email}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        // Trigger new creation: pass null to signal creation mode
                        // The parent form handles showing a creation flow
                        window.open("/voyageurs/new", "_blank");
                        setOpen(false);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Créer un nouveau voyageur
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => onChange(null)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Retirer le voyageur</span>
        </Button>
      )}
    </div>
  );
}
