import React from "react";

interface PdfThumbnailProps {
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  onThumbnailClick: (pageNumber: number) => void;
  currentPage: number;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  pdfDocument,
  onThumbnailClick,
  currentPage,
}) => {
  const renderThumbnails = async () => {
    if (!pdfDocument) return null;

    const thumbnails = [];
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 0.2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext("2d");
      await page.render({ canvasContext: context, viewport }).promise;

      thumbnails.push(
        <div
          key={i}
          onClick={() => onThumbnailClick(i)}
          style={{
            cursor: "pointer",
            border: currentPage === i ? "2px solid blue" : "none",
            margin: "5px",
          }}
        >
          <img src={canvas.toDataURL()} alt={`Page ${i}`} />
        </div>
      );
    }
    return thumbnails;
  };

  return <div style={{ display: "flex", flexDirection: "column" }}>{renderThumbnails()}</div>;
};

export default PdfThumbnail;