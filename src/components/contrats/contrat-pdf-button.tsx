"use client";

import { useState, useEffect } from "react";
import { Eye, Loader2 } from "lucide-react";
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
  const [PDFViewer, setPDFViewer] = useState<React.ComponentType<any> | null>(null);
  const [ContratPDF, setContratPDF] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (open && !loaded) {
      Promise.all([
        import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
        import("./contrat-pdf").then((mod) => mod.ContratPDF),
      ]).then(([Viewer, PDF]) => {
        setPDFViewer(() => Viewer);
        setContratPDF(() => PDF);
        setLoaded(true);
      });
    }
  }, [open, loaded]);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Eye className="h-4 w-4 mr-2" />
        Voir le contrat
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Aperçu du contrat</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-6 pb-6">
            {!loaded || !PDFViewer || !ContratPDF ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PDFViewer width="100%" height="100%" showToolbar>
                <ContratPDF {...data} />
              </PDFViewer>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
