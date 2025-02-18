import React, { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import PdfThumbnail from "./PdfThumbnail";
import ZoomControls from "./ZoomControls";
import FieldPalette from "./FieldPalette";
import SignatureField from "./SignatureField";
import { getAdjustedPageAndPosition } from "../utils";
import { PdfViewerProps, SignatureFieldData, DraggedField } from "../types";
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdfjs-dist/pdf.worker.mjs`;

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
  const [draggedField, setDraggedField] = useState<DraggedField>({
    fieldId: null,
    isExisting: false,
    fieldType: null,
  });
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

  const scrollToPage = useCallback((pageNumber: number) => {
    if (scrollContainerRef.current && pageRefs.current[pageNumber - 1]) {
      const pageElement = pageRefs.current[pageNumber - 1];
      if (!pageElement) return;
      const scrollTop = pageElement.offsetTop;
      scrollContainerRef.current.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }
  }, []);

  const handleThumbnailClick = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
    if (pageRefs.current[pageNumber - 1]) {
      const pageElement = pageRefs.current[pageNumber - 1];
      if (!pageElement || !scrollContainerRef.current) return;
      const scrollTop = pageElement.offsetTop;
      scrollContainerRef.current.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }
  }, []);

  const handleZoomIn = () =>
    setZoomLevel((prevZoomLevel) => prevZoomLevel + 0.25);
  const handleZoomOut = () =>
    setZoomLevel((prevZoomLevel) => Math.max(prevZoomLevel - 0.25, 0.25));

  const handleSave = () => {
    const dataToSend = { signatureFields: signatureFields };
    console.log("Signature Fields Data:", JSON.stringify(dataToSend, null, 2));
  };

  const updateCurrentPage = useCallback(() => {
    if (!scrollContainerRef.current || !pageRefs.current.length) return;
    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    for (let i = 0; i < pageRefs.current.length; i++) {
      const pageRef = pageRefs.current[i];
      if (!pageRef) continue;
      const pageRect = pageRef.getBoundingClientRect();
      const pageTop = pageRef.offsetTop;
      if (
        scrollTop >= pageTop - containerHeight / 2 &&
        scrollTop < pageTop + pageRect.height - containerHeight / 2
      ) {
        if (currentPage !== i + 1) {
          setCurrentPage(i + 1);
        }
        break;
      }
    }
  }, [currentPage]);

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
      if (currentPage > 1) {
        scrollToPage(currentPage);
      }
    }
  }, [currentPage, pdfDocument, zoomLevel, scrollToPage]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    let isInitialLoad = true;
    const handleScroll = () => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      updateCurrentPage();
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [updateCurrentPage]);

  const handlePaletteClick = async (fieldType: "signature" | "stamp") => {
    if (!pdfDocument || !scrollContainerRef.current) return;
    updateCurrentPage();
    const pdfPage = await pdfDocument.getPage(currentPage);
    const viewport = pdfPage.getViewport({ scale: zoomLevel });
    const pageWidth = viewport.width / zoomLevel;
    const pageHeight = viewport.height / zoomLevel;
    const fieldWidth = 100;
    const fieldHeight = 30;
    const centerX = (pageWidth - fieldWidth) / 2;
    const centerY = (pageHeight - fieldHeight) / 2;
    const newSignatureField: SignatureFieldData = {
      id: signatureIdCounter,
      page: currentPage,
      x: centerX,
      y: centerY,
      width: fieldWidth,
      height: fieldHeight,
      fieldType: fieldType,
      fieldStatus: "pending",
    };
    setSignatureFields((prevFields) => [...prevFields, newSignatureField]);
    setSignatureIdCounter((prev) => prev + 1);
    scrollToPage(currentPage);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const getPageFromY = (
    clientY: number
  ): { page: number; pageTop: number } | null => {
    if (!scrollContainerRef.current) return null;
    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const scrollTop = scrollContainerRef.current.scrollTop;
    const mouseY = clientY - containerRect.top + scrollTop;
    for (let i = 0; i < pageRefs.current.length; i++) {
      const pageElement = pageRefs.current[i];
      if (!pageElement) continue;
      const pageRect = pageElement.getBoundingClientRect();
      const pageTop = pageElement.offsetTop;
      if (mouseY >= pageTop && mouseY <= pageTop + pageRect.height) {
        return { page: i + 1, pageTop: pageTop };
      }
    }
    return null;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const pageInfo = getPageFromY(e.clientY);
    if (!pageInfo || !scrollContainerRef.current || !pdfDocument) return;
    const { page, pageTop } = pageInfo;
    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const scrollTop = scrollContainerRef.current.scrollTop;
    const pdfPage = await pdfDocument.getPage(page);
    const viewport = pdfPage.getViewport({ scale: zoomLevel });
    const pageHeight = viewport.height / zoomLevel;
    const fieldWidth = 100;
    const fieldHeight = 30;
    const relativeX =
      (e.clientX - containerRect.left) / zoomLevel - fieldWidth / 2;
    const relativeY =
      (e.clientY - containerRect.top + scrollTop - pageTop) / zoomLevel -
      fieldHeight / 2;
    const adjustedPosition = getAdjustedPageAndPosition(
      relativeY,
      page,
      pageHeight,
      fieldHeight,
      pdfDocument.numPages
    );
    if (draggedField.isExisting && draggedField.fieldId !== null) {
      setSignatureFields((prevFields) =>
        prevFields.map((field) =>
          field.id === draggedField.fieldId
            ? {
                ...field,
                page: adjustedPosition.page,
                x: Math.max(
                  0,
                  Math.min(relativeX, viewport.width / zoomLevel - fieldWidth)
                ),
                y: adjustedPosition.y,
              }
            : field
        )
      );
    } else if (draggedField.fieldType) {
      const newSignatureField: SignatureFieldData = {
        id: signatureIdCounter,
        page: adjustedPosition.page,
        x: Math.max(
          0,
          Math.min(relativeX, viewport.width / zoomLevel - fieldWidth)
        ),
        y: adjustedPosition.y,
        width: fieldWidth,
        height: fieldHeight,
        fieldType: draggedField.fieldType,
        fieldStatus: "pending",
      };
      setSignatureFields((prevFields) => [...prevFields, newSignatureField]);
      setSignatureIdCounter((prev) => prev + 1);
    }
    setDraggedField({ fieldId: null, isExisting: false, fieldType: null });
  };

  const handleFieldDragStart = (
    e: React.DragEvent,
    field: SignatureFieldData
  ) => {
    e.stopPropagation();
    setDraggedField({
      fieldId: field.id,
      isExisting: true,
      fieldType: field.fieldType,
    });
    const ghostDiv = document.createElement("div");
    ghostDiv.style.width = "100px";
    ghostDiv.style.height = "30px";
    ghostDiv.style.backgroundColor = "rgba(0, 0, 255, 0.2)";
    document.body.appendChild(ghostDiv);
    e.dataTransfer.setDragImage(ghostDiv, 50, 15);
    setTimeout(() => document.body.removeChild(ghostDiv), 0);
  };

  const handlePaletteDragStart = (
    e: React.DragEvent,
    fieldType: "signature" | "stamp"
  ) => {
    setDraggedField({ fieldId: null, isExisting: false, fieldType: fieldType });
  };

  const handleDeleteField = (e: React.MouseEvent, fieldId: number) => {
    e.stopPropagation();
    setSignatureFields((prevFields) =>
      prevFields.filter((field) => field.id !== fieldId)
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <PdfThumbnail
        pdfDocument={pdfDocument}
        onThumbnailClick={handleThumbnailClick}
        currentPage={currentPage}
      />
      <div>
        <FieldPalette
          onPaletteClick={handlePaletteClick}
          onPaletteDragStart={handlePaletteDragStart}
        />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              overflowY: "scroll",
              height: "80vh",
            }}
            ref={scrollContainerRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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
                        zoomLevel={zoomLevel}
                        onFieldDragStart={handleFieldDragStart}
                        onDeleteField={handleDeleteField}
                      />
                    ))}
                </div>
              ))}
          </div>
        </div>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default PdfViewer;
