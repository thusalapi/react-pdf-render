import React, { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import PdfThumbnail from "./PdfThumbnail";
import FieldPalette from "./FieldPalette";
import { useDrop } from "react-dnd";

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
  const [signatureFields, setSignatureFields] = useState<SignatureFieldData[]>(
    []
  );
  const [signatureIdCounter, setSignatureIdCounter] = useState<number>(0);
  const [selectedFieldType, setSelectedFieldType] = useState<
    "signature" | "stamp" | null
  >(null);

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

  const renderAllPages = useCallback(async () => {
    if (!pdfDocument) return;

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      await renderPage(i, zoomLevel);
    }
  }, [pdfDocument, zoomLevel]);

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

  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedFieldType || !pdfDocument || !scrollContainerRef.current)
      return;

    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - containerRect.left) / zoomLevel;
    const y = (e.clientY - containerRect.top) / zoomLevel;

    const newSignatureField: SignatureFieldData = {
      id: signatureIdCounter,
      page: currentPage,
      x: x,
      y: y,
      width: 100,
      height: 30,
      fieldType: "signature",
      fieldStatus: "completed",
    };

    setSignatureFields([...signatureFields, newSignatureField]);
    setSignatureIdCounter(signatureIdCounter + 1); // Increment counter
    setSelectedFieldType(null); // Deselect the field type after placing
  };
  const [, drop] = useDrop({
    accept: "SIGNATURE",
    drop: (item: any, monitor) => {
      const canvas = canvasRefs.current[currentPage - 1];
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const offset = monitor.getClientOffset();

      if (!offset) return;

      const x = offset.x - rect.left; // Mouse X relative to canvas
      const y = offset.y - rect.top; // Mouse Y relative to canvas

      pdfDocument?.getPage(currentPage).then((page) => {
        const viewport = page.getViewport({ scale: zoomLevel });

        // Convert canvas coordinates to PDF coordinates
        const transform = viewport.transform;
        const pdfX = transform[0] + (x - transform[4]) / transform[0];
        const pdfY = transform[3] + (y - transform[5]) / transform[3];

        setSignatureFields((prevFields) => [
          ...prevFields,
          {
            id: signatureIdCounter,
            page: currentPage,
            x: pdfX,
            y: pdfY,
            width: 100,
            height: 30,
            fieldType: item.fieldType,
            fieldStatus: "pending",
          },
        ]);
        setSignatureIdCounter(signatureIdCounter + 1);
      });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // const handleFieldDrag = (id: number, newX: number, newY: number) => {
  //   const updatedFields = signatureFields.map((field) =>
  //     field.id === id ? { ...field, x: newX, y: newY } : field
  //   );
  //   setSignatureFields(updatedFields);
  // };

  // const handleFieldResize = (
  //   id: number,
  //   newWidth: number,
  //   newHeight: number
  // ) => {
  //   const updatedFields = signatureFields.map((field) =>
  //     field.id === id ? { ...field, width: newWidth, height: newHeight } : field
  //   );
  //   setSignatureFields(updatedFields);
  // };

  const handleFieldSelected = (fieldType: "signature" | "stamp" | null) => {
    setSelectedFieldType(fieldType);
  };

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

        // Create canvas references and render all pages
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
      <div>
        <FieldPalette onFieldSelected={handleFieldSelected} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
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
              position: "relative",
              display: "flex",
              flexDirection: "column",
              overflowY: "scroll",
              height: "80vh",
              cursor: selectedFieldType ? "crosshair" : "default",
            }}
            ref={scrollContainerRef}
            onClick={handleDocumentClick}
          >
            <div ref={(node) => drop(node)} style={{ position: "relative" }}>
              {numPages &&
                Array.from({ length: numPages }, (_, index) => (
                  <canvas
                    key={index}
                    ref={(el) => {
                      canvasRefs.current[index] = el;
                    }}
                    style={{ marginBottom: "50px", border: "1px solid #000" }}
                  />
                ))}

              {signatureFields
                .filter((field) => field.page === currentPage)
                .map((field) => (
                  <div
                    key={field.id}
                    style={{
                      position: "absolute",
                      left: field.x * zoomLevel,
                      top: field.y * zoomLevel,
                      border: "1px solid blue",
                      width: "100px",
                      height: "40px",
                      pointerEvents: "none", // Make sure it doesn't interfere with canvas events
                    }}
                  >
                    {field.id}
                  </div>
                ))}
            </div>
          </div>
        </div>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default PdfViewer;
