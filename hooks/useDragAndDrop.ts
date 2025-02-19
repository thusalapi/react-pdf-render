import { useState } from "react";
import { SignatureFieldData, DraggedField } from "../types";
import { getAdjustedPageAndPosition } from "../utils";
import * as pdfjsLib from "pdfjs-dist";

export const useDragAndDrop = (
  pdfDocument: pdfjsLib.PDFDocumentProxy | null,
  scale: number,
  setSignatureFields: React.Dispatch<
    React.SetStateAction<SignatureFieldData[]>
  >,
  signatureIdCounter: number,
  setSignatureIdCounter: React.Dispatch<React.SetStateAction<number>>,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
) => {
  const [draggedField, setDraggedField] = useState<DraggedField>({
    fieldId: null,
    isExisting: false,
    fieldType: null,
  });

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const getPageFromY = (
    clientY: number
  ): { page: number; pageElement: HTMLElement } | null => {
    if (!scrollContainerRef.current) return null;

    for (let i = 0; i < pageRefs.current.length; i++) {
      const pageElement = pageRefs.current[i];
      if (!pageElement) continue;

      const rect = pageElement.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return { page: i + 1, pageElement };
      }
    }
    return null;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    const pageInfo = getPageFromY(e.clientY);
    if (!pageInfo || !pdfDocument) return;

    const { page, pageElement } = pageInfo;
    const canvas = pageElement.querySelector("canvas");
    if (!canvas) return;

    // Get canvas and its bounds
    const canvasRect = canvas.getBoundingClientRect();

    // Get PDF page and its viewport
    const pdfPage = await pdfDocument.getPage(page);
    const viewport = pdfPage.getViewport({ scale: 1.0 }); // Get base viewport

    // Calculate position in PDF coordinates
    const fieldWidth = 100;
    const fieldHeight = 30;

    // Convert screen coordinates to PDF coordinates
    const pdfX = (e.clientX - canvasRect.left) / scale - fieldWidth / 2;
    const pdfY = (e.clientY - canvasRect.top) / scale - fieldHeight / 2;

    // Ensure coordinates stay within page bounds
    const boundedX = Math.max(0, Math.min(pdfX, viewport.width - fieldWidth));
    const boundedY = Math.max(0, Math.min(pdfY, viewport.height - fieldHeight));

    if (draggedField.isExisting && draggedField.fieldId !== null) {
      // Update existing field
      setSignatureFields((prevFields) =>
        prevFields.map((field) =>
          field.id === draggedField.fieldId
            ? {
                ...field,
                page,
                x: boundedX,
                y: boundedY,
              }
            : field
        )
      );
    } else if (draggedField.fieldType) {
      // Create new field
      const newSignatureField: SignatureFieldData = {
        id: signatureIdCounter,
        page,
        x: boundedX,
        y: boundedY,
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

    // Create drag ghost
    const ghostDiv = document.createElement("div");
    ghostDiv.style.width = `${field.width}px`;
    ghostDiv.style.height = `${field.height}px`;
    ghostDiv.style.backgroundColor = "rgba(25, 118, 210, 0.2)";
    ghostDiv.style.border = "1px solid #1976d2";
    document.body.appendChild(ghostDiv);
    e.dataTransfer.setDragImage(ghostDiv, field.width / 2, field.height / 2);
    setTimeout(() => document.body.removeChild(ghostDiv), 0);
  };

  const handlePaletteDragStart = (
    e: React.DragEvent,
    fieldType: "signature" | "stamp"
  ) => {
    setDraggedField({ fieldId: null, isExisting: false, fieldType: fieldType });
  };

  return {
    handleDragOver,
    handleDrop,
    handleFieldDragStart,
    handlePaletteDragStart,
  };
};
