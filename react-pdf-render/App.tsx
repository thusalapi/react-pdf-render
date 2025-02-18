import React from "react";
import PdfViewer from "./components/PdfViewer";

const App: React.FC = () => {
  const pdfUrl = "path/to/your/pdf/document.pdf"; // Replace with your PDF URL

  return (
    <div>
      <h1>PDF Viewer</h1>
      <PdfViewer pdfUrl={pdfUrl} />
    </div>
  );
};

export default App;