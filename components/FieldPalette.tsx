import React from "react";
import SignatureField from "./SignatureField";

interface FieldPaletteProps {
  onFieldSelected: (fieldType: "signature" | "stamp" | null) => void;
}

const FieldPalette: React.FC<FieldPaletteProps> = ({ onFieldSelected }) => {
  const handleDragStart = (
    e: React.DragEvent,
    fieldType: "signature" | "stamp"
  ) => {
    e.dataTransfer.setData("fieldType", fieldType);
    onFieldSelected(fieldType);
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, "signature")}
        style={{ cursor: "move", marginBottom: "10px" }}
      >
        <SignatureField id="signature-field" fieldType="signature" />
      </div>
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, "stamp")}
        style={{ cursor: "move" }}
      >
        <SignatureField id="stamp-field" fieldType="stamp" />
      </div>
    </div>
  );
};

export default FieldPalette;
