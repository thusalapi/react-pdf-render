import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { SignatureFieldProps } from "../types";
import { Box, IconButton } from "@mui/material";

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
    <Box
      ref={setNodeRef}
      sx={style}
      {...listeners}
      {...attributes}
      onDragStart={(e) => onFieldDragStart(e, field)}
    >
      {field.fieldType === "signature" ? "Signature" : "Stamp"}
      <IconButton
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          background: "red",
          color: "white",
          border: "none",
          cursor: "pointer",
          padding: "4px",
        }}
        onClick={(e) => onDeleteField(e, field.id)}
      ></IconButton>
    </Box>
  );
};

export default SignatureField;
