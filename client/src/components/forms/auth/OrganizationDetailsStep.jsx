// src/components/forms/auth/OrganizationDetailsStep.jsx
import { useFormContext } from "react-hook-form";
import Grid from "@mui/material/Grid";
import MuiTextField from "../../common/MuiTextField";
import MuiSelectAutocomplete from "../../common/MuiSelectAutocomplete";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import {
  MAX_ORG_NAME_LENGTH,
  MAX_ORG_DESCRIPTION_LENGTH,
  MAX_ADDRESS_LENGTH,
  VALID_INDUSTRIES,
  PHONE_REGEX,
} from "../../../utils/constants.js";

const ORGANIZATION_SIZES = [
  { id: "small", label: "Small", icon: <HomeWorkIcon fontSize="small" /> },
  {
    id: "medium",
    label: "Medium",
    icon: <BusinessCenterIcon fontSize="small" />,
  },
  { id: "large", label: "Large", icon: <CorporateFareIcon fontSize="small" /> },
];

const INDUSTRIES = VALID_INDUSTRIES.map((industry) => ({
  id: industry.toLowerCase().replace(/\s+/g, "-"),
  label: industry,
}));

const OrganizationDetailsStep = () => {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext();

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <MuiTextField
          {...register("organizationName", {
            required: "Organization name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: MAX_ORG_NAME_LENGTH,
              message: `Maximum ${MAX_ORG_NAME_LENGTH} characters`,
            },
            pattern: {
              value: /^[a-zA-Z]+$/,
              message: "Only letters allowed",
            },
          })}
          required
          error={errors.organizationName}
          label="Organization Name"
          fullWidth
          size="small"
          startAdornment={<BusinessIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("organizationEmail", {
            required: "Organization email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address",
            },
          })}
          required
          error={errors.organizationEmail}
          label="Organization Email"
          type="email"
          fullWidth
          size="small"
          startAdornment={<EmailIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("organizationPhone", {
            required: "Phone number is required",
            pattern: {
              value: PHONE_REGEX,
              message: "Please enter a valid phone number",
            },
          })}
          required
          error={errors.organizationPhone}
          label="Phone Number"
          fullWidth
          size="small"
          startAdornment={<PhoneIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MuiTextField
          {...register("organizationAddress", {
            required: "Address is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: MAX_ADDRESS_LENGTH,
              message: `Maximum ${MAX_ADDRESS_LENGTH} characters`,
            },
          })}
          required
          error={errors.organizationAddress}
          label="Address"
          fullWidth
          size="small"
          multiline
          rows={2}
          startAdornment={<LocationOnIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiSelectAutocomplete
          name="organizationSize"
          control={control}
          label="Organization Size"
          options={ORGANIZATION_SIZES}
          required
          fullWidth
          size="small"
          startAdornment={<BusinessIcon fontSize="small" color="primary" />}
          rules={{
            required: "Organization size is required",
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiSelectAutocomplete
          name="organizationIndustry"
          control={control}
          label="Industry"
          options={INDUSTRIES}
          required
          fullWidth
          size="small"
          startAdornment={<WorkIcon fontSize="small" color="primary" />}
          rules={{
            required: "Industry is required",
          }}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MuiTextField
          {...register("description", {
            required: "Description is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: MAX_ORG_DESCRIPTION_LENGTH,
              message: `Maximum ${MAX_ORG_DESCRIPTION_LENGTH} characters`,
            },
          })}
          required
          error={errors.description}
          label="Description"
          fullWidth
          placeholder="Tell us about your organization"
          size="small"
          multiline
          rows={4}
          // startAdornment={<LocationOnIcon fontSize="small" color="primary" />}
        />
      </Grid>
    </Grid>
  );
};

export default OrganizationDetailsStep;
