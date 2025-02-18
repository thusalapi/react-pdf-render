import { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

export interface PdfViewerProps {
  pdfUrl: string;
}

export interface SignatureFieldData {
  id: number;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fieldType: "signature" | "stamp";
  fieldStatus: "pending" | "completed";
}

export interface DraggedField {
  fieldId: number | null;
  isExisting: boolean;
  fieldType: "signature" | "stamp" | null;
}

export interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export interface PdfThumbnailProps {
  pdfDocument: PDFDocumentProxy | null;
  onThumbnailClick: (pageNumber: number) => void;
  currentPage: number;
}

export interface FieldPaletteProps {
  onPaletteClick: (fieldType: "signature" | "stamp") => void;
  onPaletteDragStart: (
    e: React.DragEvent,
    fieldType: "signature" | "stamp"
  ) => void;
}

export interface SignatureFieldProps {
  field: SignatureFieldData;
  zoomLevel: number;
  onFieldDragStart: (e: React.DragEvent, field: SignatureFieldData) => void;
  onDeleteField: (e: React.MouseEvent, fieldId: number) => void;
}
