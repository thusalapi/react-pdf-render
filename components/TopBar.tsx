import React from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import {
  Menu as MenuIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from "@mui/icons-material";

interface TopBarProps {
  onToggleThumbnails: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomLevel: number;
}

const TopBar: React.FC<TopBarProps> = ({
  onToggleThumbnails,
  onZoomIn,
  onZoomOut,
  zoomLevel,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "background.paper",
        p: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <IconButton onClick={onToggleThumbnails}>
        <MenuIcon />
      </IconButton>
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={onZoomOut} size="small">
            <ZoomOutIcon />
          </IconButton>
          <Typography variant="body2">
            {Math.round(zoomLevel * 100)}%
          </Typography>
          <IconButton onClick={onZoomIn} size="small">
            <ZoomInIcon />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};

export default TopBar;
