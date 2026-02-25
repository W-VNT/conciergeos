"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { removeContratLogement } from "@/lib/actions/contrat-logements";
import type { ContratLogement } from "@/types/database";

interface Props {
  contratLogements: ContratLogement[];
  isAdmin: boolean;
}

export function MultiLogementSection({ contratLogements, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleRemove(id: string) {
    if (!confirm("Retirer ce logement du contrat ?")) return;
    startTransition(async () => {
      await removeContratLogement(id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Logements ({contratLogements.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contratLogements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun logement associé à ce contrat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">Logement</th>
                  <th className="text-left py-2">Adresse</th>
                  <th className="text-right py-2">Commission</th>
                  <th className="text-left py-2">Notes</th>
                  {isAdmin && <th className="w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {contratLogements.map((cl: any) => (
                  <tr key={cl.id} className="border-b">
                    <td className="py-2 font-medium">{cl.logement?.name || "—"}</td>
                    <td className="py-2 text-muted-foreground">{cl.logement?.city || "—"}</td>
                    <td className="py-2 text-right font-semibold">{cl.commission_rate}%</td>
                    <td className="py-2 text-xs text-muted-foreground">{cl.notes || ""}</td>
                    {isAdmin && (
                      <td className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={isPending} onClick={() => handleRemove(cl.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
