/* eslint-disable */
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { SignatureFieldProps } from "../types";

const SignatureField: React.FC<SignatureFieldProps> = ({
  field,
  zoomLevel,
  onFieldDragStart,
  onDeleteField,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: field?.id ?? "default-id",
    });

  if (!field) {
    return null;
  }

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    fontWeight: "bold",
    cursor: "move",
    border: "1px dashed gray",
    padding: "8px",
    backgroundColor: "white",
    width: `${field.width * zoomLevel}px`,
    height: `${field.height * zoomLevel}px`,
    position: "absolute",
    left: `${field.x * zoomLevel}px`,
    top: `${field.y * zoomLevel}px`,
    textAlign: "center",
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onDragStart={(e) => onFieldDragStart(e, field)}
    >
      {field.fieldType === "signature" ? "Signature" : "Stamp"}
      <button
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          background: "red",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
        onClick={(e) => onDeleteField(e, field.id)}
      >
        X
      </button>
    </div>
  );
};

export default SignatureField;
