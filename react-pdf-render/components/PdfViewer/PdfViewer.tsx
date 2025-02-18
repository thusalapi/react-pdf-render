import React, { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import PdfThumbnail from "./PdfThumbnail";
import SignatureField from "./SignatureField";
import ZoomControls from "./ZoomControls";
import FieldPalette from "./FieldPalette";
import { Trash2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdfjs-dist/pdf.worker.mjs`;

interface PdfViewerProps {
  pdfUrl: string | null;
}

interface SignatureFieldData {
  id: number;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fieldType: "signature" | "stamp";
  fieldStatus: "completed" | "pending";
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl }) => {
  const [pdfDocument, setPdfDocument] =
    useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.5);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderingTasks = useRef<(pdfjsLib.RenderTask | null)[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [signatureFields, setSignatureFields] = useState<SignatureFieldData[]>([]);
  const [signatureIdCounter, setSignatureIdCounter] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      if (error instanceof Error && error.name !== "RenderingCancelledException") {
        console.error("Error rendering page:", error);
      }
    }
  };

  const renderAllPages = useCallback(async () => {
    if (!pdfDocument) return;

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      await renderPage(i, zoomLevel);
    }
  }, [pdfDocument, zoomLevel]);

  const handleThumbnailClick = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  const handleSave = () => {
    const dataToSend = {
      signatureFields: signatureFields,
    };

    console.log("Signature Fields Data:", JSON.stringify(dataToSend, null, 2));
  };

  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfUrl) return;

      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);

        canvasRefs.current = Array.from({ length: pdf.numPages }, () => null);
        await renderAllPages();
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
      renderAllPages();
    }
  }, [currentPage, pdfDocument, zoomLevel]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <PdfThumbnail
        pdfDocument={pdfDocument}
        onThumbnailClick={handleThumbnailClick}
        currentPage={currentPage}
      />
      <div>
        <FieldPalette
          onAddField={(fieldType) => {
            const newSignatureField: SignatureFieldData = {
              id: signatureIdCounter,
              page: currentPage,
              x: 0,
              y: 0,
              width: 100,
              height: 30,
              fieldType: fieldType,
              fieldStatus: "pending",
            };
            setSignatureFields((prevFields) => [...prevFields, newSignatureField]);
            setSignatureIdCounter((prev) => prev + 1);
          }}
        />
        <ZoomControls
          zoomLevel={zoomLevel}
          onZoomIn={() => setZoomLevel((prev) => prev + 0.25)}
          onZoomOut={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.25))}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            overflowY: "scroll",
            height: "80vh",
          }}
          ref={scrollContainerRef}
        >
          {numPages &&
            Array.from({ length: numPages }, (_, index) => (
              <div
                key={index}
                ref={(el) => {
                  pageRefs.current[index] = el;
                }}
                style={{ position: "relative", marginBottom: "50px" }}
              >
                <canvas
                  ref={(el) => {
                    canvasRefs.current[index] = el;
                  }}
                  style={{ border: "1px solid #000" }}
                />
                {signatureFields
                  .filter((field) => field.page === index + 1)
                  .map((field) => (
                    <SignatureField
                      key={field.id}
                      field={field}
                      onDelete={() => {
                        setSignatureFields((prevFields) =>
                          prevFields.filter((f) => f.id !== field.id)
                        );
                      }}
                    />
                  ))}
              </div>
            ))}
        </div>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default PdfViewer;