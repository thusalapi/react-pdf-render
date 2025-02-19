import { useRef, useCallback, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

export const useRenderPages = (
  pdfDocument: pdfjsLib.PDFDocumentProxy | null,
  zoomLevel: number
) => {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderingTasks = useRef<(pdfjsLib.RenderTask | null)[]>([]);
  const [baseViewports, setBaseViewports] = useState<pdfjsLib.PageViewport[]>(
    []
  );

  const renderPage = async (pageNumber: number, scale: number) => {
    if (!pdfDocument || !canvasRefs.current[pageNumber - 1]) return;

    try {
      const page = await pdfDocument.getPage(pageNumber);

      // Create base viewport if not exists
      if (!baseViewports[pageNumber - 1]) {
        const baseViewport = page.getViewport({ scale: 1.0 });
        setBaseViewports((prev) => {
          const newViewports = [...prev];
          newViewports[pageNumber - 1] = baseViewport;
          return newViewports;
        });
      }

      const viewport = page.getViewport({ scale: 1.0 }); // Always use base scale
      const canvas = canvasRefs.current[pageNumber - 1];
      const context = canvas?.getContext("2d");

      if (canvas) {
        // Set canvas to base dimensions
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);

        // Apply zoom through CSS transform
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = "top left";

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

  const getPageDimensions = (pageNumber: number) => {
    const viewport = baseViewports[pageNumber - 1];
    if (!viewport) return { width: 0, height: 0 };
    return {
      width: viewport.width,
      height: viewport.height,
    };
  };

  return { canvasRefs, renderAllPages, getPageDimensions };
};
