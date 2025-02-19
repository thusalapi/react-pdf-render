import React, { useState, useEffect, useCallback } from "react";
import PdfThumbnail from "./PdfThumbnail";
import TopBar from "./TopBar";
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Delete as DeleteIcon, Save as SaveIcon } from "@mui/icons-material";
import { usePdfDocument } from "../hooks/usePdfDocument";
import { useRenderPages } from "../hooks/useRenderPages";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { useScroll } from "../hooks/useScroll";

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

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl }) => {
  const theme = useTheme();
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [signatureFields, setSignatureFields] = useState<SignatureFieldData[]>(
    []
  );
  const [signatureIdCounter, setSignatureIdCounter] = useState<number>(0);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);

  const { pdfDocument, numPages } = usePdfDocument(pdfUrl || "");
  const { canvasRefs, renderAllPages, getPageDimensions, cleanup } =
    useRenderPages(pdfDocument, zoomLevel);
  const { scrollContainerRef, pageRefs, scrollToPage } = useScroll(
    currentPage,
    setCurrentPage
  );
  const {
    handleDragOver,
    handleDrop,
    handleFieldDragStart,
    handlePaletteDragStart,
  } = useDragAndDrop(
    pdfDocument,
    zoomLevel,
    setSignatureFields,
    signatureIdCounter,
    setSignatureIdCounter,
    scrollContainerRef,
    pageRefs
  );

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  useEffect(() => {
    if (pdfDocument) {
      renderAllPages();
      if (currentPage > 1) {
        scrollToPage(currentPage);
      }
    }
  }, [currentPage, pdfDocument, zoomLevel, scrollToPage, renderAllPages]);

  const handleThumbnailClick = useCallback(
    (pageNumber: number) => {
      setCurrentPage(pageNumber);
      if (pageRefs.current[pageNumber - 1]) {
        const pageElement = pageRefs.current[pageNumber - 1];
        if (!pageElement || !scrollContainerRef.current) return;
        const scrollTop = pageElement.offsetTop;
        scrollContainerRef.current.scrollTo({
          top: scrollTop,
          behavior: "smooth",
        });
      }
    },
    [scrollContainerRef, pageRefs]
  );

  const handleZoomIn = () => {
    setZoomLevel((prevZoomLevel) => Math.min(prevZoomLevel + 0.25, 2.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prevZoomLevel) => Math.max(prevZoomLevel - 0.25, 0.25));
  };

  const handleSave = () => {
    const dataToSend = {
      signatureFields: signatureFields,
    };
    console.log("Signature Fields Data:", JSON.stringify(dataToSend, null, 2));
  };

  const handlePaletteClick = async (fieldType: "signature" | "stamp") => {
    if (!pdfDocument || !scrollContainerRef.current) return;
    const pdfPage = await pdfDocument.getPage(currentPage);
    const viewport = pdfPage.getViewport({ scale: zoomLevel });
    const pageWidth = viewport.width / zoomLevel;
    const pageHeight = viewport.height / zoomLevel;
    const fieldWidth = 100;
    const fieldHeight = 30;
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
    scrollToPage(currentPage);
  };

  const handleDeleteField = (e: React.MouseEvent, fieldId: number) => {
    e.stopPropagation();
    setSignatureFields((prevFields) =>
      prevFields.filter((field) => field.id !== fieldId)
    );
  };

  const handleToggleThumbnails = () => {
    setShowThumbnails((prev) => !prev);
  };

  return (
    <Box display="flex" flexDirection="column" sx={{ height: "100vh" }}>
      <TopBar
        onToggleThumbnails={handleToggleThumbnails}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        zoomLevel={zoomLevel}
      />
      <Box display="flex" sx={{ flex: 1, gap: 2 }}>
        {showThumbnails && (
          <Box sx={{ flexShrink: 0 }}>
            <PdfThumbnail
              pdfDocument={pdfDocument}
              onThumbnailClick={handleThumbnailClick}
              currentPage={currentPage}
            />
          </Box>
        )}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
          }}
        >
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Box>
              <Box
                ref={scrollContainerRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                sx={{
                  height: "90vh",
                  overflowY: "scroll",
                  overflowX: "auto",
                  position: "relative",
                  bgcolor: theme.palette.grey[100],
                  p: 2,
                  margin: "0 auto",
                }}
              >
                <Stack spacing={4} alignItems="center">
                  {numPages &&
                    Array.from({ length: numPages }, (_, index) => (
                      <Box
                        key={index}
                        ref={(el: HTMLDivElement | null) => {
                          pageRefs.current[index] = el;
                        }}
                        position="relative"
                        sx={{
                          width: getPageDimensions(index + 1).width,
                          height: getPageDimensions(index + 1).height,
                        }}
                      >
                        <Paper
                          elevation={3}
                          sx={{
                            width: "fit-content",
                            height: "fit-content",
                          }}
                        >
                          <canvas
                            ref={(el) => {
                              canvasRefs.current[index] = el;
                            }}
                            style={{
                              display: "block",
                              transformOrigin: "center center",
                              maxWidth: "100%",
                              height: "auto",
                            }}
                          />
                        </Paper>
                        {signatureFields
                          .filter((field) => field.page === index + 1)
                          .map((field) => (
                            <Paper
                              key={field.id}
                              elevation={2}
                              draggable
                              onDragStart={(e) =>
                                handleFieldDragStart(e, field)
                              }
                              sx={{
                                position: "absolute",
                                left: field.x * zoomLevel,
                                top: field.y * zoomLevel,
                                width: field.width * zoomLevel,
                                height: field.height * zoomLevel,
                                bgcolor: "rgba(25, 118, 210, 0.08)",
                                border: `1px solid ${theme.palette.primary.main}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "move",
                                userSelect: "none",
                                zIndex: 1000,
                                transition: "all 0.2s ease-in-out",
                              }}
                            >
                              <Stack alignItems="center">
                                <Typography variant="caption">
                                  {field.fieldType === "signature"
                                    ? "Signature"
                                    : "Stamp"}{" "}
                                  #{field.id}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={(e) =>
                                    handleDeleteField(e, field.id)
                                  }
                                  sx={{
                                    position: "absolute",
                                    top: -20,
                                    right: -20,
                                    bgcolor: "white",
                                    "&:hover": {
                                      bgcolor: theme.palette.error.light,
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" color="error" />
                                </IconButton>
                              </Stack>
                            </Paper>
                          ))}
                      </Box>
                    ))}
                </Stack>
              </Box>
            </Box>
            {/* <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              fullWidth
            >
              Save
            </Button> */}
          </Stack>
        </Box>
        <Box
          sx={{
            backgroundColor: "red",
            width: "20%",
          }}
        >
          <Paper elevation={2} sx={{ p: 2, flexShrink: 0 }}>
            <Stack spacing={1}>
              <Box
                draggable
                onClick={() => handlePaletteClick("signature")}
                onDragStart={(e) => handlePaletteDragStart(e, "signature")}
                sx={{
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "primary.main",
                  borderRadius: 1,
                  cursor: "move",
                  textAlign: "center",
                  bgcolor: "background.paper",
                  "&:hover": {
                    bgcolor: "primary.light",
                    color: "primary.contrastText",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                Signature Field
              </Box>
              <Box
                draggable
                onClick={() => handlePaletteClick("stamp")}
                onDragStart={(e) => handlePaletteDragStart(e, "stamp")}
                sx={{
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "primary.main",
                  borderRadius: 1,
                  cursor: "move",
                  textAlign: "center",
                  bgcolor: "background.paper",
                  "&:hover": {
                    bgcolor: "primary.light",
                    color: "primary.contrastText",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                Stamp Field
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default PdfViewer;
