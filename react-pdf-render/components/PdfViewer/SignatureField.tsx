import React from "react";
import { Trash2 } from "lucide-react";

interface SignatureFieldProps {
  field: {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    fieldType: "signature" | "stamp";
  };
  zoomLevel: number;
  onDelete: (id: number) => void;
  onDragStart: (e: React.DragEvent, field: any) => void;
}

const SignatureField: React.FC<SignatureFieldProps> = ({
  field,
  zoomLevel,
  onDelete,
  onDragStart,
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, field)}
      style={{
        position: "absolute",
        left: field.x * zoomLevel,
        top: field.y * zoomLevel,
        border: "1px solid blue",
        width: field.width * zoomLevel,
        height: field.height * zoomLevel,
        backgroundColor: "rgba(0, 0, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "move",
        userSelect: "none",
        zIndex: 1000,
        transition: "all 0.2s ease-in-out",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {field.fieldType === "signature" ? "Signature" : "Stamp"} #{field.id}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(field.id);
          }}
          style={{
            position: "absolute",
            top: -15,
            right: -15,
            padding: "4px",
            background: "white",
            border: "1px solid red",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
        >
          <Trash2 size={16} color="red" />
        </button>
      </div>
    </div>
  );
};

export default SignatureField;