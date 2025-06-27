
import {
  TextField,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
} from '@mui/material';
import type { UIAdapter, FieldProps } from '@schemaform/core';
import React from 'react';

const MuiTextField: React.FC<FieldProps> = ({
  field,
  label,
  formState,
  ...props
}) => (
  <TextField
    {...field}
    {...props}
    label={label}
    error={!!formState.errors[field.name]}
    helperText={formState.errors[field.name]?.message as string}
  />
);

const MuiCheckbox: React.FC<FieldProps> = ({
  field,
  label,
  ...props
}) => (
  <FormControlLabel
    control={<Checkbox {...field} {...props} checked={!!field.value} />}
    label={label}
  />
);

const MuiSelect: React.FC<FieldProps> = ({
  field,
  label,
  options,
  formState,
  ...props
}) => (
  <FormControl fullWidth error={!!formState.errors[field.name]}>
    <InputLabel>{label}</InputLabel>
    <Select {...field} {...props} label={label}>
      {options?.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
    {formState.errors[field.name] && (
      <FormHelperText>
        {formState.errors[field.name]?.message as string}
      </FormHelperText>
    )}
  </FormControl>
);

export const muiAdapter: UIAdapter = {
  string: MuiTextField,
  number: (props) => <MuiTextField {...props} type="number" />,
  boolean: MuiCheckbox,
  select: MuiSelect,
  password: (props) => <MuiTextField {...props} type="password" />,
  date: (props) => <MuiTextField {...props} type="date" />,
  textarea: (props) => <MuiTextField {...props} multiline rows={4} />,
};
