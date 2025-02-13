import React from "react";

interface FieldPaletteProps {
  onFieldSelected: (fieldType: "signature" | "stamp" | null) => void;
}

const FieldPalette: React.FC<FieldPaletteProps> = ({ onFieldSelected }) => {
  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", width: "200px" }}>
      <h3>Add Field</h3>
      <button onClick={() => onFieldSelected("signature")}>Signature</button>
      <button onClick={() => onFieldSelected("stamp")}>Stamp</button>
      <button onClick={() => onFieldSelected(null)}>Clear Selection</button>
    </div>
  );
};

export default FieldPalette;