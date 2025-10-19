import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

export const LoadingFallback = ({
  message = "Loading...",
  height = "100vh",
  sx = {},
}) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        ...sx,
      }}
    >
      <CircularProgress size={40} thickness={4} disableShrink />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export const BackdropFallback = ({ message = "Loading...", open, sx = {} }) => {
  return (
    <Backdrop open={open}>
      <LoadingFallback message={message} sx={sx} />
    </Backdrop>
  );
};

LoadingFallback.propTypes = {
  message: PropTypes.string,
  sx: PropTypes.object,
};

export default LoadingFallback;
