import React from "react";

interface FieldPaletteProps {
  onAddField: (fieldType: "signature" | "stamp") => void;
}

const FieldPalette: React.FC<FieldPaletteProps> = ({ onAddField }) => {
  const handlePaletteClick = (fieldType: "signature" | "stamp") => {
    onAddField(fieldType);
  };

  return (
    <div>
      <div
        draggable
        onClick={() => handlePaletteClick("signature")}
        onDragStart={(e) => e.preventDefault()}
        style={{ marginBottom: "10px", cursor: "move" }}
      >
        Signature Field
      </div>
      <div
        draggable
        onClick={() => handlePaletteClick("stamp")}
        onDragStart={(e) => e.preventDefault()}
        style={{ marginBottom: "20px", cursor: "move" }}
      >
        Stamp Field
      </div>
    </div>
  );
};

export default FieldPalette;