# React PDF Render

This project is a React application that allows users to view and interact with PDF documents. It provides features for zooming in and out, navigating through pages, and adding signature or stamp fields to the PDF.

## Features

- **PDF Viewing**: Load and display PDF documents with support for multiple pages.
- **Zoom Controls**: Zoom in and out of the PDF for better readability.
- **Page Navigation**: Navigate through pages using thumbnails.
- **Signature Fields**: Add, drag, and drop signature or stamp fields onto the PDF.
- **Responsive Design**: The application is designed to be responsive and user-friendly.

## Components

### PdfViewer
The main component that handles loading and rendering the PDF document, managing the current page, zoom level, and signature fields.

### PdfThumbnail
Displays thumbnails for each page of the PDF document, allowing users to click on a thumbnail to navigate to the corresponding page.

### SignatureField
Represents an individual signature or stamp field on the PDF. It handles the rendering of the field and its drag-and-drop functionality.

### ZoomControls
Provides buttons for zooming in and out of the PDF document.

### FieldPalette
Contains draggable elements for adding signature and stamp fields to the PDF.

## Installation

To get started with the project, clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd react-pdf-render
npm install
```

## Usage

To run the application, use the following command:

```bash
npm start
```

This will start the development server and open the application in your default web browser.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.