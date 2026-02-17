"use client";

import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markContratAsSigned } from "@/lib/actions/contrats";
import type { ContratPDFData } from "./contrat-pdf";

interface ContratPDFButtonProps {
  data: ContratPDFData;
  contratId: string;
  isSigned?: boolean;
  filename?: string;
}

export function ContratPDFButton({ data, contratId, isSigned = false, filename }: ContratPDFButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [PDFDownloadLink, setPDFDownloadLink] = useState<React.ComponentType<any> | null>(null);
  const [ContratPDF, setContratPDF] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    Promise.all([
      import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
      import("./contrat-pdf").then((mod) => mod.ContratPDF),
    ]).then(([Link, PDF]) => {
      setPDFDownloadLink(() => Link);
      setContratPDF(() => PDF);
      setMounted(true);
    });
  }, []);

  const defaultFilename = `contrat-${data.proprietaire?.full_name?.toLowerCase().replace(/\s+/g, "-") ?? "proprietaire"}-${data.contrat.id.slice(0, 8)}.pdf`;

  async function handleDownload() {
    if (!isSigned) {
      try {
        await markContratAsSigned(contratId);
      } catch {
        // Ignore — contract may already be signed
      }
    }
  }

  if (!mounted || !PDFDownloadLink || !ContratPDF) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Génération...
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<ContratPDF {...data} />}
      fileName={filename ?? defaultFilename}
      onClick={handleDownload}
    >
      {({ loading }: { loading: boolean }) => (
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Télécharger le contrat PDF
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
