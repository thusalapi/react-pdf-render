import React, { useEffect, useState, Fragment } from "react";
import { Box, Typography, Stack, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PdfThumbnailProps } from "../types";

const ThumbnailContainer = styled(Paper)(({ theme }) => ({
  width: "200px",
  height: "100vh",
  borderRight: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  padding: "27px 32px",
  backgroundColor: theme.palette.grey[100],
}));

const ThumbnailItem = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ theme, active }) => ({
  cursor: "pointer",
  margin: theme.spacing(1),
  padding: theme.spacing(1),
  position: "relative",
  transition: "transform 0.2s ease",
  border: active ? `2px solid ${theme.palette.primary.main}` : "none",
  "&:hover": {
    transform: "scale(1.02)",
  },
}));

const PageNumber = styled(Box)(({ theme }) => ({
  marginTop: "6px",
  textAlign: "center",
  fontSize: 12,
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
    <ThumbnailContainer elevation={0}>
      <Stack spacing={7} sx={{ px: 1 }}>
        {pageThumbnails.map((thumbnail, index) => (
          <Fragment key={index}>
            <ThumbnailItem
              active={currentPage === index + 1}
              elevation={currentPage === index + 1 ? 2 : 0}
              onClick={() => onThumbnailClick(index + 1)}
            >
              <Box sx={{ position: "relative" }}>
                <img
                  src={thumbnail}
                  alt={`Page ${index + 1}`}
                  style={{
                    width: "100%",
                    display: "block",
                    borderRadius: 4,
                  }}
                />
              </Box>
            </ThumbnailItem>
            <PageNumber>
              <Typography variant="caption">{index + 1}</Typography>
            </PageNumber>
          </Fragment>
        ))}
      </Stack>
    </ThumbnailContainer>
  );
};

export default PdfThumbnail;
