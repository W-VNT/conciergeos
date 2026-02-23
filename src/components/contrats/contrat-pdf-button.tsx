"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ContratPDFData } from "./contrat-pdf";

interface ContratPDFButtonProps {
  data: ContratPDFData;
}

export function ContratPDFButton({ data }: ContratPDFButtonProps) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [PDFViewer, setPDFViewer] = useState<React.ComponentType<any> | null>(null);
  const [ContratPDF, setContratPDF] = useState<React.ComponentType<any> | null>(null);
  const [pdfFunc, setPdfFunc] = useState<any>(null);

  const loadModules = useCallback(async () => {
    if (loaded) return;
    const [rendererMod, pdfMod] = await Promise.all([
      import("@react-pdf/renderer"),
      import("./contrat-pdf"),
    ]);
    setPDFViewer(() => rendererMod.PDFViewer);
    setPdfFunc(() => rendererMod.pdf);
    setContratPDF(() => pdfMod.ContratPDF);
    setLoaded(true);
  }, [loaded]);

  useEffect(() => {
    if (open) loadModules();
  }, [open, loadModules]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await loadModules();
      // Wait a tick for state to settle
      // We need to import fresh since state may not have updated yet
      const [{ pdf }, { ContratPDF: PDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./contrat-pdf"),
      ]);
      const blob = await pdf(<PDF {...data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrat-${data.contrat.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          <span className="hidden sm:inline">Télécharger PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
        <Button variant="outline" onClick={() => setOpen(true)} className="hidden sm:inline-flex">
          <Eye className="h-4 w-4 mr-2" />
          Aperçu
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex flex-row items-center justify-between gap-4">
            <DialogTitle>Aperçu du contrat</DialogTitle>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              Télécharger
            </Button>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-6 pb-6">
            {!loaded || !PDFViewer || !ContratPDF ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PDFViewer width="100%" height="100%" showToolbar={false}>
                <ContratPDF {...data} />
              </PDFViewer>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
