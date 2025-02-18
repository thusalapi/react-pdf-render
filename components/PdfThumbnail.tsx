import React, { useEffect, useState } from "react";
import { PdfThumbnailProps } from "../types";

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  pdfDocument,
  onThumbnailClick,
  currentPage,
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
      <h3>Pages</h3>
      <ul>
        {pageThumbnails.map((thumbnail, index) => (
          <li
            key={index}
            onClick={() => onThumbnailClick(index + 1)}
            style={{
              cursor: "pointer",
              backgroundColor: currentPage === index + 1 ? "#f0f0f0" : "white",
              padding: "5px",
              borderBottom: "1px solid #eee",
              position: "relative",
              transition: "background-color 0.2s ease",
            }}
          >
            <img
              src={thumbnail}
              alt={`Page ${index + 1}`}
              style={{
                width: "100%",
                border:
                  currentPage === index + 1
                    ? "2px solid #000"
                    : "1px solid #ddd",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "5px",
                left: "5px",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                padding: "2px 5px",
                borderRadius: "3px",
                fontSize: "12px",
              }}
            >
              Page {index + 1}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default PdfThumbnail;
