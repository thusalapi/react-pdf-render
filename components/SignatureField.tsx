import React from "react";
import { useDrag } from "react-dnd";

interface SignatureFieldProps {
  id: string;
  fieldType: "signature" | "stamp";
}

const SignatureField: React.FC<SignatureFieldProps> = ({ id, fieldType }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "SIGNATURE",
    item: { id: id, type: "SIGNATURE", fieldType: fieldType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        fontWeight: "bold",
        cursor: "move",
        border: "1px dashed gray",
        padding: "8px",
        backgroundColor: "white",
        width: "100px",
        textAlign: "center",
      }}
    >
      {fieldType === "signature" ? "Signature" : "Stamp"}
    </div>
  );
};

export default SignatureField;
