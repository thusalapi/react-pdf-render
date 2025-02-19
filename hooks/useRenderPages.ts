import { useRef, useCallback, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

export const useRenderPages = (
  pdfDocument: pdfjsLib.PDFDocumentProxy | null,
  scale: number
) => {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderingTasks = useRef<(pdfjsLib.RenderTask | null)[]>([]);
  const [pageViewports, setPageViewports] = useState<pdfjsLib.PageViewport[]>(
    []
  );

  const renderPage = async (pageNumber: number) => {
    if (!pdfDocument || !canvasRefs.current[pageNumber - 1]) return;

    try {
      const page = await pdfDocument.getPage(pageNumber);
      const canvas = canvasRefs.current[pageNumber - 1];
      const context = canvas?.getContext("2d");

      if (!canvas || !context) return;

      // Cancel any ongoing rendering for this page
      if (renderingTasks.current[pageNumber - 1]) {
        renderingTasks.current[pageNumber - 1]!.cancel();
      }

      // Calculate viewport with current scale
      const viewport = page.getViewport({ scale });

      // Store viewport for dimension calculations
      setPageViewports((prev) => {
        const newViewports = [...prev];
        newViewports[pageNumber - 1] = viewport;
        return newViewports;
      });

      // Handle high DPI displays
      const outputScale = window.devicePixelRatio || 1;

      // Set physical canvas size for high DPI
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);

      // Set display size
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Set up rendering context
      const transform =
        outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        transform: transform,
      };

      // Start rendering
      const renderTask = page.render(renderContext);
      renderingTasks.current[pageNumber - 1] = renderTask;

      await renderTask.promise;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name !== "RenderingCancelledException"
      ) {
        console.error(`Error rendering page ${pageNumber}:`, error);
      }
    }
  };

  const renderAllPages = useCallback(async () => {
    if (!pdfDocument) return;

    const promises = Array.from({ length: pdfDocument.numPages }, (_, i) =>
      renderPage(i + 1)
    );

    await Promise.all(promises);
  }, [pdfDocument, scale]);

  const getPageDimensions = useCallback(
    (pageNumber: number) => {
      const viewport = pageViewports[pageNumber - 1];
      if (!viewport) return { width: 0, height: 0 };

      return {
        width: viewport.width,
        height: viewport.height,
      };
    },
    [pageViewports]
  );

  // Cleanup function to cancel rendering tasks
  const cleanup = useCallback(() => {
    renderingTasks.current.forEach((task) => task?.cancel());
    renderingTasks.current = [];
  }, []);

  return {
    canvasRefs,
    renderAllPages,
    getPageDimensions,
    cleanup,
  };
};
