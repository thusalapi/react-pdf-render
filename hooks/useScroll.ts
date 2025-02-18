import { useRef, useCallback, useEffect } from "react";

export const useScroll = (
  numPages: number | null,
  currentPage: number,
  setCurrentPage: (page: number) => void
) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

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
  }, [currentPage, setCurrentPage]);

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

  return { scrollContainerRef, pageRefs, scrollToPage };
};
