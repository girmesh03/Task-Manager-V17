// client/src/components/forms/vendors/CreateUpdateVendor.jsx
import { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { Box, Button, Grid } from "@mui/material";
import { toast } from "react-toastify";
import MuiTextField from "../../common/MuiTextField";
import { handleRTKError } from "../../../utils/errorHandler";
import {
  useCreateVendorMutation,
  useUpdateVendorMutation,
} from "../../../redux/features/vendor/vendorApi";
import {
  MAX_VENDOR_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  PHONE_REGEX,
} from "../../../utils/constants";

/**
 * CreateUpdateVendor Component
 * 
 * Form for creating or editing vendors.
 * 
 * @param {Object} props
 * @param {Object} [props.vendor] - Vendor object for editing (null for create)
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onCancel - Cancel callback
 * @returns {JSX.Element}
 */
const CreateUpdateVendor = ({ vendor, onSuccess, onCancel }) => {
  const isEditMode = !!vendor;
  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (vendor) {
      reset({
        name: vendor.name || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
      });
    }
  }, [vendor, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await updateVendor({ vendorId: vendor._id, data }).unwrap();
        toast.success("Vendor updated successfully");
      } else {
        await createVendor(data).unwrap();
        toast.success("Vendor created successfully");
      }
      onSuccess();
    } catch (error) {
      handleRTKError(error, `Failed to ${isEditMode ? "update" : "create"} vendor`);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        {/* Vendor Name */}
        <Grid size={{ xs: 12 }}>
          <MuiTextField
            {...register("name", {
              required: "Vendor name is required",
              maxLength: {
                value: MAX_VENDOR_NAME_LENGTH,
                message: `Maximum ${MAX_VENDOR_NAME_LENGTH} characters`,
              },
            })}
            label="Vendor Name"
            error={errors.name}
            fullWidth
            size="small"
            margin="normal"
          />
        </Grid>

        {/* Email */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiTextField
            {...register("email", {
              required: "Email is required",
              maxLength: {
                value: MAX_EMAIL_LENGTH,
                message: `Maximum ${MAX_EMAIL_LENGTH} characters`,
              },
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email format",
              },
            })}
            label="Email"
            type="email"
            error={errors.email}
            fullWidth
            size="small"
            margin="normal"
          />
        </Grid>

        {/* Phone */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiTextField
            {...register("phone", {
              required: "Phone is required",
              pattern: {
                value: PHONE_REGEX,
                message: "Invalid phone format (e.g., +1234567890)",
              },
            })}
            label="Phone"
            type="tel"
            error={errors.phone}
            fullWidth
            size="small"
            margin="normal"
            helperText="Format: +1234567890"
          />
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
        <Button onClick={onCancel} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isCreating || isUpdating || (!isDirty && isEditMode)}
        >
          {isCreating || isUpdating
            ? "Saving..."
            : isEditMode
            ? "Update Vendor"
            : "Create Vendor"}
        </Button>
      </Box>
    </Box>
  );
};

CreateUpdateVendor.propTypes = {
  vendor: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CreateUpdateVendor;
