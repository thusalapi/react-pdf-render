import React, { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

interface PdfThumbnailsProps {
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  onThumbnailClick: (pageNumber: number) => void;
}

const PdfThumbnail: React.FC<PdfThumbnailsProps> = ({
  pdfDocument,
  onThumbnailClick,
}) => {
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);

  useEffect(() => {
    const generateThumbnails = async () => {
      if (!pdfDocument) return;

      const thumbnails: string[] = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport })
            .promise;
        }
        thumbnails.push(canvas.toDataURL());
      }
      setPageThumbnails(thumbnails);
    };

    generateThumbnails();
  }, [pdfDocument]);

  return (
    <aside style={{ width: "200px", borderRight: "1px solid #ccc" }}>
      <h3>Document Pages</h3>
      <ul>
        {pageThumbnails.map((thumbnail, index) => (
          <li key={index} onClick={() => onThumbnailClick(index + 1)}>
            <img
              src={thumbnail}
              alt={`Page ${index + 1}`}
              style={{ width: "100%", cursor: "pointer" }}
            />
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default PdfThumbnail;
