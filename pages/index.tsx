import React, { useState } from "react";
import PdfViewer from "@/components/PdfViewer";
import UploadButton from "@/components/UploadButton";

const Home: React.FC = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handlePdfUploaded = (url: string) => {
    setPdfUrl(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <UploadButton onPdfUploaded={handlePdfUploaded} />
      {pdfUrl && <PdfViewer pdfUrl={pdfUrl} />}
    </div>
  );
};

export default Home;
