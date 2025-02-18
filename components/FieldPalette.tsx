import React from "react";
import { FieldPaletteProps } from "../types";

const FieldPalette: React.FC<FieldPaletteProps> = ({
  onPaletteClick,
  onPaletteDragStart,
}) => {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        draggable
        onDragStart={(e) => onPaletteDragStart(e, "signature")}
        onClick={() => onPaletteClick("signature")}
        style={{ cursor: "move", marginBottom: "10px" }}
      >
        Signature
      </div>
      <div
        draggable
        onDragStart={(e) => onPaletteDragStart(e, "stamp")}
        onClick={() => onPaletteClick("stamp")}
        style={{ cursor: "move" }}
      >
        Stamp
      </div>
    </div>
  );
};

export default FieldPalette;
