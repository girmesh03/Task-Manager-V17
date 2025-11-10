// client/src/components/forms/materials/CreateUpdateMaterial.jsx
import { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { Box, Button, Grid } from "@mui/material";
import { toast } from "react-toastify";
import MuiTextField from "../../common/MuiTextField";
import MuiSelectAutocomplete from "../../common/MuiSelectAutocomplete";
import MuiNumberField from "../../common/MuiNumberField";
import { handleRTKError } from "../../../utils/errorHandler";
import {
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
} from "../../../redux/features/material/materialApi";
import {
  MAX_MATERIAL_NAME_LENGTH,
  MATERIAL_UNIT_TYPES,
  MATERIAL_CATEGORIES,
  MAX_MATERIAL_PRICE,
} from "../../../utils/constants";

/**
 * CreateUpdateMaterial Component
 * 
 * Form for creating or editing materials.
 * 
 * @param {Object} props
 * @param {Object} [props.material] - Material object for editing (null for create)
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onCancel - Cancel callback
 * @returns {JSX.Element}
 */
const CreateUpdateMaterial = ({ material, onSuccess, onCancel }) => {
  const isEditMode = !!material;
  const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();
  const [updateMaterial, { isLoading: isUpdating }] = useUpdateMaterialMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      name: "",
      unit: "",
      price: "",
      category: "",
    },
  });

  useEffect(() => {
    if (material) {
      reset({
        name: material.name || "",
        unit: material.unit || "",
        price: material.price || "",
        category: material.category || "",
      });
    }
  }, [material, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await updateMaterial({ materialId: material._id, data }).unwrap();
        toast.success("Material updated successfully");
      } else {
        await createMaterial(data).unwrap();
        toast.success("Material created successfully");
      }
      onSuccess();
    } catch (error) {
      handleRTKError(error, `Failed to ${isEditMode ? "update" : "create"} material`);
    }
  };

  const unitOptions = MATERIAL_UNIT_TYPES.map((unit) => ({
    id: unit,
    label: unit,
  }));

  const categoryOptions = MATERIAL_CATEGORIES.map((category) => ({
    id: category,
    label: category,
  }));

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        {/* Material Name */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiTextField
            {...register("name", {
              required: "Material name is required",
              maxLength: {
                value: MAX_MATERIAL_NAME_LENGTH,
                message: `Maximum ${MAX_MATERIAL_NAME_LENGTH} characters`,
              },
            })}
            label="Material Name"
            error={errors.name}
            fullWidth
            size="small"
            margin="normal"
          />
        </Grid>

        {/* Category */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiSelectAutocomplete
            name="category"
            control={control}
            rules={{ required: "Category is required" }}
            options={categoryOptions}
            label="Category"
            required
          />
        </Grid>

        {/* Unit */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiSelectAutocomplete
            name="unit"
            control={control}
            rules={{ required: "Unit is required" }}
            options={unitOptions}
            label="Unit"
            required
          />
        </Grid>

        {/* Price */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiNumberField
            {...register("price", {
              required: "Price is required",
              min: {
                value: 0,
                message: "Price must be positive",
              },
              max: {
                value: MAX_MATERIAL_PRICE,
                message: `Maximum price is ${MAX_MATERIAL_PRICE}`,
              },
            })}
            label="Price"
            error={errors.price}
            min={0}
            max={MAX_MATERIAL_PRICE}
            step={0.01}
            prefix="$"
            fullWidth
            size="small"
            margin="normal"
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
            ? "Update Material"
            : "Create Material"}
        </Button>
      </Box>
    </Box>
  );
};

CreateUpdateMaterial.propTypes = {
  material: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CreateUpdateMaterial;
