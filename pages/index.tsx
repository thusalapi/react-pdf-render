import React, { useState } from "react";
import { Box, AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import PdfViewer from "../components/PdfViewer";
import UploadButton from "../components/UploadButton";

const Home: React.FC = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handlePdfUploaded = (url: string) => {
    setPdfUrl(url);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit">
            <Close />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            Document Viewer
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {!pdfUrl ? (
          <Box sx={{ p: 3 }}>
            <UploadButton onPdfUploaded={handlePdfUploaded} />
          </Box>
        ) : (
          <PdfViewer pdfUrl={pdfUrl} />
        )}
      </Box>
    </Box>
  );
};

export default Home;
