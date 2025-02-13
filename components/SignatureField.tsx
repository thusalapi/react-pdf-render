import React, { useState } from "react";

interface SignatureFieldProps {
  x: number;
  y: number;
  width: number;
  height: number;
  id: number;
  onDrag: (id: number, x: number, y: number) => void;
  onResize: (id: number, width: number, height: number) => void;
  zoomLevel: number;
}

const SignatureField: React.FC<SignatureFieldProps> = ({
  x,
  y,
  width,
  height,
  id,
  onDrag,
  onResize,
  zoomLevel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - x * zoomLevel,
      y: e.clientY - y * zoomLevel,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = (e.clientX - dragOffset.x) / zoomLevel;
    const newY = (e.clientY - dragOffset.y) / zoomLevel;
    onDrag(id, newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResize = (e: React.MouseEvent) => {
    const newWidth =
      width + (e.clientX - x * zoomLevel - width * zoomLevel) / zoomLevel;
    const newHeight =
      height + (e.clientY - y * zoomLevel - height * zoomLevel) / zoomLevel;
    onResize(id, newWidth, newHeight);
    setCurrentWidth(newWidth);
    setCurrentHeight(newHeight);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: x * zoomLevel,
        top: y * zoomLevel,
        width: width * zoomLevel,
        height: height * zoomLevel,
        border: "2px dashed blue",
        backgroundColor: "rgba(0, 0, 255, 0.1)",
        zIndex: 10,
        cursor: "move",
        boxSizing: "border-box", // Important for accurate sizing
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Resize Handle - simple example, refine as needed */}
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: "10px",
          height: "10px",
          backgroundColor: "rgba(0, 0, 255, 0.5)",
          cursor: "se-resize",
        }}
        onMouseDown={handleResize}
      />
    </div>
  );
};

export default SignatureField;