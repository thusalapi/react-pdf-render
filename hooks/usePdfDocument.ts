import { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdfjs-dist/pdf.worker.mjs`;

export const usePdfDocument = (pdfUrl: string) => {
  const [pdfDocument, setPdfDocument] =
    useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfUrl) return;
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };
    loadPdf();
    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [pdfUrl]);

  return { pdfDocument, numPages };
};
