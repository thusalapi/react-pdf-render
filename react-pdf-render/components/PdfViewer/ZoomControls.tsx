import React from "react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ onZoomIn, onZoomOut }) => {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
      <button onClick={onZoomOut}>Zoom Out</button>
      <button onClick={onZoomIn}>Zoom In</button>
    </div>
  );
};

export default ZoomControls;