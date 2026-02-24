import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Hotel } from "lucide-react";
import Link from "next/link";
import type { Voyageur } from "@/types/database";

interface VoyageurCardProps {
  voyageur: Voyageur;
}

export function VoyageurCard({ voyageur }: VoyageurCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Fiche voyageur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Nom</span>
          <Link
            href={`/voyageurs/${voyageur.id}`}
            className="font-medium text-primary hover:underline"
          >
            {voyageur.full_name}
          </Link>
        </div>

        {voyageur.email && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> Email
            </span>
            <a href={`mailto:${voyageur.email}`} className="text-primary hover:underline">
              {voyageur.email}
            </a>
          </div>
        )}

        {voyageur.phone && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> Téléphone
            </span>
            <a href={`tel:${voyageur.phone}`} className="text-primary hover:underline">
              {voyageur.phone}
            </a>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <Hotel className="h-3.5 w-3.5" /> Séjours
          </span>
          <Badge variant="secondary">{voyageur.total_stays}</Badge>
        </div>

        {voyageur.tags && voyageur.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {voyageur.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="pt-2">
          <Link
            href={`/voyageurs/${voyageur.id}`}
            className="text-xs text-primary hover:underline"
          >
            Voir la fiche complète
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
