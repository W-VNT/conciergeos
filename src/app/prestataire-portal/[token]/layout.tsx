import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portail Prestataire | ConciergeOS",
  description: "Portail prestataire - Gestion des missions, incidents et devis",
};

export default function PrestatairePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-muted/30">{children}</div>;
}
