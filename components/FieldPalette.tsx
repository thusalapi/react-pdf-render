import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FieldPaletteProps } from "../types";

const DraggableField = styled(Paper)(({ theme }) => ({
  cursor: "move",
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  textAlign: "center",
  backgroundColor: theme.palette.background.paper,
  transition: "all 0.2s",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[2],
  },
}));

const FieldPalette: React.FC<FieldPaletteProps> = ({
  onPaletteClick,
  onPaletteDragStart,
}) => {
  return (
    <Box>
      <DraggableField
        draggable
        onDragStart={(e) => onPaletteDragStart(e, "signature")}
        onClick={() => onPaletteClick("signature")}
      >
        <Typography>Signature</Typography>
      </DraggableField>
      <DraggableField
        draggable
        onDragStart={(e) => onPaletteDragStart(e, "stamp")}
        onClick={() => onPaletteClick("stamp")}
      >
        <Typography>Stamp</Typography>
      </DraggableField>
    </Box>
  );
};

export default FieldPalette;
