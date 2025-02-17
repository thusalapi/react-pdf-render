import React from "react";
import SignatureField from "./SignatureField";

interface FieldPaletteProps {
  onFieldSelected: (fieldType: "signature" | "stamp" | null) => void; // optional
}

const FieldPalette: React.FC<FieldPaletteProps> = ({ onFieldSelected }) => {
  return (
    <div style={{ marginBottom: "20px" }}>
      <SignatureField id="signature-field" fieldType="signature" />
      <SignatureField id="stamp-field" fieldType="stamp" />
    </div>
  );
};

export default FieldPalette;
