import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const [zoomLevel, setZoomLevel] = useState<number>(1.5);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderingTasks = useRef<(pdfjsLib.RenderTask | null)[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const renderPage = async (pageNumber: number, scale: number) => {
    if (!pdfDocument || !canvasRefs.current[pageNumber - 1]) return;

    try {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRefs.current[pageNumber - 1];
      const context = canvas?.getContext("2d");
      if (canvas) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        // High DPI scaling for sharper rendering
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        context?.scale(outputScale, outputScale);
      }

      if (context) {
        if (renderingTasks.current[pageNumber - 1]) {
          renderingTasks.current[pageNumber - 1]!.cancel();
        }
        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });
        renderingTasks.current[pageNumber - 1] = renderTask;
        await renderTask.promise;
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.name !== "RenderingCancelledException"
      ) {
        console.error("Error rendering page:", error);
      }
    }
  };

  const scrollToPage = useCallback(
    (pageNumber: number) => {
      if (scrollContainerRef.current && canvasRefs.current[pageNumber - 1]) {
        const canvas = canvasRefs.current[pageNumber - 1];
        const canvasTop = canvas ? canvas.offsetTop : 0;

        scrollContainerRef.current.scrollTo({
          top: canvasTop,
          behavior: "smooth",
        });
      }
    },
    [canvasRefs]
  );

  const handleThumbnailClick = useCallback(
    (pageNumber: number) => {
      setCurrentPage(pageNumber);
      scrollToPage(pageNumber);
    },
    [scrollToPage]
  );

  const handleZoomIn = () => {
    setZoomLevel((prevZoomLevel) => prevZoomLevel + 0.5);
  };

  const handleZoomOut = () => {
    setZoomLevel((prevZoomLevel) => Math.max(prevZoomLevel - 0.5, 0.5));
  };

  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfUrl) return;

      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1); // Reset to page 1 when a new PDF is loaded

        if (pdf.numPages > 0) {
          renderPage(1, zoomLevel); // Render first page after loading
        }
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

  useEffect(() => {
    if (pdfDocument) {
      renderPage(currentPage, zoomLevel);
      scrollToPage(currentPage);
    }
  }, [currentPage, pdfDocument, zoomLevel, scrollToPage]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <PdfThumbnail
        pdfDocument={pdfDocument}
        onThumbnailClick={handleThumbnailClick}
        currentPage={currentPage}
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "10px",
          }}
        >
          <button onClick={handleZoomOut}>Zoom Out</button>
          <button onClick={handleZoomIn}>Zoom In</button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflowY: "scroll",
            height: "80vh",
          }}
          ref={scrollContainerRef} // Attach ref here
        >
          {numPages &&
            Array.from({ length: numPages }, (_, index) => (
              <canvas
                key={index}
                ref={(el) => {
                  canvasRefs.current[index] = el;
                }}
                style={{ marginBottom: "10px" }}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
