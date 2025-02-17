import React from "react";
import SignatureField from "./SignatureField";

interface FieldPaletteProps {
  onFieldSelected: (fieldType: "signature" | "stamp" | null) => void;
}

const FieldPalette: React.FC<FieldPaletteProps> = ({ onFieldSelected }) => {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div onClick={() => onFieldSelected("signature")}>
        <SignatureField id="signature-field" fieldType="signature" />
      </div>
      <div onClick={() => onFieldSelected("stamp")}>
        <SignatureField id="stamp-field" fieldType="stamp" />
      </div>
    </div>
  );
};

export default FieldPalette;
