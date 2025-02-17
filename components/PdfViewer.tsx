import React, { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import PdfThumbnail from "./PdfThumbnail";
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

interface DraggedField {
  fieldId: number | null;
  isExisting: boolean;
  fieldType: "signature" | "stamp" | null;
}

// const isFieldOverlappingPageBoundary = (
//   y: number,
//   pageHeight: number,
//   fieldHeight: number
// ): boolean => {
//   return y + fieldHeight > pageHeight || y < 0;
// };

const getAdjustedPageAndPosition = (
  y: number,
  pageNumber: number,
  pageHeight: number,
  fieldHeight: number,
  totalPages: number
): { page: number; y: number } => {
  if (y + fieldHeight > pageHeight) {
    if (pageNumber < totalPages) {
      return { page: pageNumber + 1, y: 0 };
    }
    return { page: pageNumber, y: pageHeight - fieldHeight };
  }
  if (y < 0) {
    if (pageNumber > 1) {
      return { page: pageNumber - 1, y: pageHeight - fieldHeight };
    }
    return { page: pageNumber, y: 0 };
  }
  return { page: pageNumber, y };
};

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

  // const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
  //   if (!selectedFieldType || !pdfDocument || !scrollContainerRef.current)
  //     return;

  //   const containerRect = scrollContainerRef.current.getBoundingClientRect();
  //   const x = (e.clientX - containerRect.left) / zoomLevel;
  //   const y = (e.clientY - containerRect.top) / zoomLevel;

  //   const newSignatureField: SignatureFieldData = {
  //     id: signatureIdCounter,
  //     page: currentPage,
  //     x: x,
  //     y: y,
  //     width: 100,
  //     height: 30,
  //     fieldType: "signature",
  //     fieldStatus: "completed",
  //   };

  //   setSignatureFields([...signatureFields, newSignatureField]);
  //   setSignatureIdCounter(signatureIdCounter + 1); // Increment counter
  //   setSelectedFieldType(null); // Deselect the field type after placing
  // };

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

  // const handleFieldSelected = (fieldType: "signature" | "stamp" | null) => {
  //   setSelectedFieldType(fieldType);
  // };

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

  // const handleDragOver = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  // };

  // const getPageFromY = (clientY: number): { page: number; pageTop: number } | null => {
  //   if (!scrollContainerRef.current) return null;

  //   const containerRect = scrollContainerRef.current.getBoundingClientRect();
  //   const scrollTop = scrollContainerRef.current.scrollTop;
  //   const mouseY = clientY - containerRect.top + scrollTop;

  //   for (let i = 0; i < pageRefs.current.length; i++) {
  //     const pageElement = pageRefs.current[i];
  //     if (!pageElement) continue;

  //     const pageRect = pageElement.getBoundingClientRect();
  //     const pageTop = pageElement.offsetTop;

  //     if (mouseY >= pageTop && mouseY <= pageTop + pageRect.height) {
  //       return {
  //         page: i + 1,
  //         pageTop: pageTop
  //       };
  //     }
  //   }

  //   return null;
  // };

  // const handleDrop = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();

  //   const fieldType = e.dataTransfer.getData("fieldType") as "signature" | "stamp";
  //   if (!fieldType || !scrollContainerRef.current) return;

  //   const pageInfo = getPageFromY(e.clientY);
  //   if (!pageInfo) return;

  //   const { page, pageTop } = pageInfo;
  //   const containerRect = scrollContainerRef.current.getBoundingClientRect();
  //   const scrollTop = scrollContainerRef.current.scrollTop;

  //   // Calculate position relative to the page
  //   const relativeX = (e.clientX - containerRect.left) / zoomLevel;
  //   const relativeY = ((e.clientY - containerRect.top + scrollTop - pageTop) / zoomLevel);

  //   const newSignatureField: SignatureFieldData = {
  //     id: signatureIdCounter,
  //     page: page,
  //     x: relativeX,
  //     y: relativeY,
  //     width: 100,
  //     height: 30,
  //     fieldType: fieldType,
  //     fieldStatus: "pending",
  //   };

  //   setSignatureFields((prevFields) => [...prevFields, newSignatureField]);
  //   setSignatureIdCounter((prev) => prev + 1);
  // };

  // const handleDragOver = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  // };

  // const getPageFromY = (
  //   clientY: number
  // ): { page: number; pageTop: number } | null => {
  //   if (!scrollContainerRef.current) return null;

  //   const containerRect = scrollContainerRef.current.getBoundingClientRect();
  //   const scrollTop = scrollContainerRef.current.scrollTop;
  //   const mouseY = clientY - containerRect.top + scrollTop;

  //   for (let i = 0; i < pageRefs.current.length; i++) {
  //     const pageElement = pageRefs.current[i];
  //     if (!pageElement) continue;

  //     const pageRect = pageElement.getBoundingClientRect();
  //     const pageTop = pageElement.offsetTop;

  //     if (mouseY >= pageTop && mouseY <= pageTop + pageRect.height) {
  //       return {
  //         page: i + 1,
  //         pageTop: pageTop,
  //       };
  //     }
  //   }

  //   return null;
  // };

  const handleFieldPaletteClick = async (fieldType: "signature" | "stamp") => {
    if (!pdfDocument || currentPage > pdfDocument.numPages) return;

    const pdfPage = await pdfDocument.getPage(currentPage);
    const viewport = pdfPage.getViewport({ scale: zoomLevel });
    const pageWidth = viewport.width / zoomLevel;
    const pageHeight = viewport.height / zoomLevel;

    // Default field dimensions
    const fieldWidth = 100;
    const fieldHeight = 30;

    // Calculate center position
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
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

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
        return {
          page: i + 1,
          pageTop: pageTop,
        };
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

    // Get current page dimensions
    const pdfPage = await pdfDocument.getPage(page);
    const viewport = pdfPage.getViewport({ scale: zoomLevel });
    const pageHeight = viewport.height / zoomLevel;

    // Calculate centered position
    const fieldWidth = 100;
    const fieldHeight = 30;
    const relativeX =
      (e.clientX - containerRect.left) / zoomLevel - fieldWidth / 2;
    const relativeY =
      (e.clientY - containerRect.top + scrollTop - pageTop) / zoomLevel -
      fieldHeight / 2;

    // Check and adjust position if near page boundaries
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

    // Set drag ghost image
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
    setDraggedField({
      fieldId: null,
      isExisting: false,
      fieldType: fieldType,
    });
  };

  const handleDeleteField = (e: React.MouseEvent, fieldId: number) => {
    e.stopPropagation();
    setSignatureFields((prevFields) =>
      prevFields.filter((field) => field.id !== fieldId)
    );
  };

  return (
    // <div style={{ display: "flex", flexDirection: "row" }}>
    //   <PdfThumbnail
    //     pdfDocument={pdfDocument}
    //     onThumbnailClick={handleThumbnailClick}
    //     currentPage={currentPage}
    //   />
    //   <div>
    //     <FieldPalette onFieldSelected={handleFieldSelected} />
    //     <div
    //       style={{
    //         display: "flex",
    //         flexDirection: "column",
    //         flex: 1,
    //       }}
    //     >
    //       <div
    //         style={{
    //           display: "flex",
    //           justifyContent: "center",
    //           marginBottom: "10px",
    //         }}
    //       >
    //         <button onClick={handleZoomOut}>Zoom Out</button>
    //         <button onClick={handleZoomIn}>Zoom In</button>
    //       </div>
    //       <div
    //         style={{
    //           position: "relative",
    //           display: "flex",
    //           flexDirection: "column",
    //           overflowY: "scroll",
    //           height: "80vh",
    //           cursor: selectedFieldType ? "crosshair" : "default",
    //         }}
    //         ref={scrollContainerRef}
    //         onClick={handleDocumentClick}
    //       >
    //         <div style={{ position: "relative" }}>
    //           {numPages &&
    //             Array.from({ length: numPages }, (_, index) => (
    //               <canvas
    //                 key={index}
    //                 ref={(el) => {
    //                   canvasRefs.current[index] = el;
    //                 }}
    //                 style={{ marginBottom: "50px", border: "1px solid #000" }}
    //               />
    //             ))}

    //           {signatureFields
    //             .filter((field) => field.page === currentPage)
    //             .map((field) => (
    //               <div
    //                 key={field.id}
    //                 style={{
    //                   position: "absolute",
    //                   left: field.x * zoomLevel,
    //                   top: field.y * zoomLevel,
    //                   border: "1px solid blue",
    //                   width: "100px",
    //                   height: "40px",
    //                   pointerEvents: "none", // Make sure it doesn't interfere with canvas events
    //                 }}
    //               >
    //                 {field.id}
    //               </div>
    //             ))}
    //         </div>
    //       </div>
    //     </div>
    //     <button onClick={handleSave}>Save</button>
    //   </div>
    // </div>

    // <div style={{ display: "flex", flexDirection: "row" }}>
    //   <PdfThumbnail
    //     pdfDocument={pdfDocument}
    //     onThumbnailClick={handleThumbnailClick}
    //     currentPage={currentPage}
    //   />
    //   <div>
    //     <FieldPalette onFieldSelected={handleFieldSelected} />
    //     <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
    //       <div
    //         style={{
    //           display: "flex",
    //           justifyContent: "center",
    //           marginBottom: "10px",
    //         }}
    //       >
    //         <button onClick={handleZoomOut}>Zoom Out</button>
    //         <button onClick={handleZoomIn}>Zoom In</button>
    //       </div>
    //       <div
    //         style={{
    //           position: "relative",
    //           display: "flex",
    //           flexDirection: "column",
    //           overflowY: "scroll",
    //           height: "80vh",
    //         }}
    //         ref={scrollContainerRef}
    //         onDragOver={handleDragOver}
    //         onDrop={handleDrop}
    //       >
    //         {numPages &&
    //           Array.from({ length: numPages }, (_, index) => (
    //             <div
    //               key={index}
    //               ref={(el) => (pageRefs.current[index] = el)}
    //               style={{ position: "relative", marginBottom: "50px" }}
    //             >
    //               <canvas
    //                 ref={(el) => {
    //                   canvasRefs.current[index] = el;
    //                 }}
    //                 style={{ border: "1px solid #000" }}
    //               />

    //               {/* Render fields for this specific page */}
    //               {signatureFields
    //                 .filter((field) => field.page === index + 1)
    //                 .map((field) => (
    //                   <div
    //                     key={field.id}
    //                     style={{
    //                       position: "absolute",
    //                       left: field.x * zoomLevel,
    //                       top: field.y * zoomLevel,
    //                       border: "1px solid blue",
    //                       width: field.width * zoomLevel,
    //                       height: field.height * zoomLevel,
    //                       backgroundColor: "rgba(0, 0, 255, 0.1)",
    //                       display: "flex",
    //                       alignItems: "center",
    //                       justifyContent: "center",
    //                       pointerEvents: "none",
    //                     }}
    //                   >
    //                     {field.fieldType === "signature"
    //                       ? "Signature"
    //                       : "Stamp"}{" "}
    //                     #{field.id}
    //                   </div>
    //                 ))}
    //             </div>
    //           ))}
    //       </div>
    //     </div>
    //     <button onClick={handleSave}>Save</button>
    //   </div>
    // </div>

    <div style={{ display: "flex", flexDirection: "row" }}>
      <PdfThumbnail
        pdfDocument={pdfDocument}
        onThumbnailClick={handleThumbnailClick}
        currentPage={currentPage}
      />
      <div>
        <div
          draggable
          onDragStart={(e) => handlePaletteDragStart(e, "signature")}
          style={{ marginBottom: "10px", cursor: "move" }}
        >
          Signature Field
        </div>
        <div
          draggable
          onDragStart={(e) => handlePaletteDragStart(e, "stamp")}
          style={{ marginBottom: "20px", cursor: "move" }}
        >
          Stamp Field
        </div>
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
                  ref={(el) => (pageRefs.current[index] = el)}
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
                      <div
                        key={field.id}
                        draggable
                        onDragStart={(e) => handleFieldDragStart(e, field)}
                        style={{
                          position: "absolute",
                          left: field.x * zoomLevel,
                          top: field.y * zoomLevel,
                          border: "1px solid blue",
                          width: field.width * zoomLevel,
                          height: field.height * zoomLevel,
                          backgroundColor: "rgba(0, 0, 255, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "move",
                          userSelect: "none",
                          zIndex: 1000,
                          transition: "all 0.2s ease-in-out",
                          transform: `translate(0, 0)`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          {field.fieldType === "signature"
                            ? "Signature"
                            : "Stamp"}{" "}
                          #{field.id}
                          <button
                            onClick={(e) => handleDeleteField(e, field.id)}
                            style={{
                              position: "absolute",
                              top: -15,
                              right: -15,
                              padding: "4px",
                              background: "white",
                              border: "1px solid red",
                              borderRadius: "50%",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 1001,
                            }}
                          >
                            <Trash2 size={16} color="red" />
                          </button>
                        </div>
                      </div>
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
