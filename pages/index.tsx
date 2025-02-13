import React, { useState } from "react";
import PdfViewer from "@/components/PdfViewer"; // Adjust path if needed
import UploadButton from "@/components/UploadButton"; // Adjust path if needed

const Home: React.FC = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handlePdfUploaded = (url: string) => {
    setPdfUrl(url);
  };

  return (
    <div>
      <h1>PDF Upload and Rendering (POC #1)</h1>
      <UploadButton onPdfUploaded={handlePdfUploaded} />
      <PdfViewer pdfUrl={pdfUrl} />
    </div>
  );
};

export default Home;
