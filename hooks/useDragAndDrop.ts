import {
  useState,
  Dispatch,
  SetStateAction,
  RefObject,
  MutableRefObject,
  DragEvent,
} from "react";
import { SignatureFieldData, DraggedField } from "../types";
import { getAdjustedPageAndPosition } from "../utils";
import * as pdfjsLib from "pdfjs-dist";

export const useDragAndDrop = (
  pdfDocument: pdfjsLib.PDFDocumentProxy | null,
  zoomLevel: number,
  setSignatureFields: Dispatch<SetStateAction<SignatureFieldData[]>>,
  signatureIdCounter: number,
  setSignatureIdCounter: Dispatch<SetStateAction<number>>,
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  pageRefs: MutableRefObject<(HTMLDivElement | null)[]>
) => {
  const [draggedField, setDraggedField] = useState<DraggedField>({
    fieldId: null,
    isExisting: false,
    fieldType: null,
  });

  const handleDragOver = (e: DragEvent) => e.preventDefault();

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

  const handleDrop = async (e: DragEvent) => {
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

  const handleFieldDragStart = (e: DragEvent, field: SignatureFieldData) => {
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
    e: DragEvent,
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
