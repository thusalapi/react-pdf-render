import React, { useState } from "react";
import PdfViewer from "@/components/PdfViewer";
import UploadButton from "@/components/UploadButton";
import { HTML5Backend } from "react-dnd-html5-backend";

import { DndProvider } from "react-dnd";

const Home: React.FC = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handlePdfUploaded = (url: string) => {
    setPdfUrl(url);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto px-4 py-8">
        <UploadButton onPdfUploaded={handlePdfUploaded} />
        {pdfUrl && <PdfViewer pdfUrl={pdfUrl} />}
      </div>
    </DndProvider>
  );
};

export default Home;
