import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import PdfThumbnail from "./PdfThumbnail";

pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdfjs-dist/pdf.worker.mjs`;

interface PdfViewerProps {
  pdfUrl: string | null;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl }) => {
  const [pdfDocument, setPdfDocument] =
    useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfUrl) return;

      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);

        // Render the first page
        renderPage(1);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    const renderPage = async (pageNumber: number) => {
      if (!pdfDocument || !canvasRef.current) return;

      try {
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport })
            .promise;
        }
      } catch (error) {
        console.error("Error rendering page:", error);
      }
    };

    loadPdf();

    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (pdfDocument) {
      const renderPage = async (pageNumber: number) => {
        if (!pdfDocument || !canvasRef.current) return;

        try {
          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport: viewport })
              .promise;
          }
        } catch (error) {
          console.error("Error rendering page:", error);
        }
      };

      renderPage(currentPage);
    }
  }, [currentPage, pdfDocument]);

  return (
    <div style={{ display: "flex" }}>
      <PdfThumbnail
        pdfDocument={pdfDocument}
        onThumbnailClick={setCurrentPage}
      />
      <div style={{ flex: 1 }}>
        {pdfDocument ? <canvas ref={canvasRef} /> : <p>No PDF loaded yet.</p>}
      </div>
    </div>
  );
};

export default PdfViewer;
