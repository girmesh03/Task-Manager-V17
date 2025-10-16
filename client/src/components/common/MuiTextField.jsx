// src/components/common/MuiTextField.jsx
import { memo, forwardRef } from "react";
import PropTypes from "prop-types";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

const MuiTextField = memo(
  forwardRef(
    ({ type = "text", startAdornment, endAdornment, ...muiProps }, ref) => {
      const computedStartAdornment = startAdornment ? (
        <InputAdornment position="start">{startAdornment}</InputAdornment>
      ) : null;

      const computedEndAdornment = endAdornment ? (
        <InputAdornment position="end">{endAdornment}</InputAdornment>
      ) : null;

      return (
        <TextField
          {...muiProps}
          type={type}
          inputRef={ref}
          slotProps={{
            input: {
              startAdornment: computedStartAdornment,
              endAdornment: computedEndAdornment,
            },
          }}
          sx={(theme) => ({
            "& .MuiButtonBase-root.MuiIconButton-root": {
              border: 'none',
              backgroundColor: 'transparent',
              color: (theme.vars || theme).palette.text.secondary,
              '&:hover': {
                backgroundColor: (theme.vars || theme).palette.action.hover,
                color: (theme.vars || theme).palette.text.primary,
              },
            }
          })}
        />
      );
    }
  )
);

MuiTextField.displayName = "MuiTextField";

MuiTextField.propTypes = {
  type: PropTypes.string,
  startAdornment: PropTypes.node,
  endAdornment: PropTypes.node,
};

export default MuiTextField;
