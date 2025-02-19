import React, { useEffect, useState } from "react";
import { Box, Typography, Stack, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PdfThumbnailProps } from "../types";

const ThumbnailContainer = styled(Paper)(({ theme }) => ({
  width: "200px",
  height: "90dvh",
  padding: "27px",
  borderRight: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  backgroundColor: theme.palette.grey[200],
  "&::-webkit-scrollbar": {
    width: "13px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.grey[300],
    borderRadius: "3px",
  },
}));

const ThumbnailItem = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ theme, active }) => ({
  cursor: "pointer",
  position: "relative",
  margin: "4px 8px",
  transition: "all 0.2s ease",
  border: active
    ? `2px solid ${theme.palette.primary.main}`
    : "1px solid #e0e0e0",
  backgroundColor: theme.palette.background.paper,
  "&:hover": {
    borderColor: theme.palette.primary.light,
  },
}));

const PageNumber = styled(Typography)(({ theme }) => ({
  position: "absolute",
  bottom: "-20px",
  left: "50%",
  transform: "translateX(-50%)",
  fontSize: "12px",
  color: theme.palette.text.secondary,
}));

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
        const viewport = page.getViewport({ scale: 0.15 });
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
    <ThumbnailContainer elevation={0}>
      <Stack spacing={4} sx={{ py: 2 }}>
        {pageThumbnails.map((thumbnail, index) => (
          <Box key={index} sx={{ position: "relative", mb: 2 }}>
            <ThumbnailItem
              active={currentPage === index + 1}
              elevation={0}
              onClick={() => onThumbnailClick(index + 1)}
            >
              <Box sx={{ p: 1 }}>
                <img
                  src={thumbnail}
                  alt={`Page ${index + 1}`}
                  style={{
                    width: "100%",
                    display: "block",
                  }}
                />
              </Box>
            </ThumbnailItem>
            <PageNumber variant="caption">{index + 1}</PageNumber>
          </Box>
        ))}
      </Stack>
    </ThumbnailContainer>
  );
};

export default PdfThumbnail;
