import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { Controller } from 'react-hook-form';
import type { UIAdapter } from './types';

export const MUIAdapter: UIAdapter = {
  renderField: (componentType, props) => {
    const {
      name,
      control,
      label,
      error,
      options,
      placeholder,
      helperText,
      disabled,
      ...rest
    } = props;

    // Helper text priority: error message > helperText from meta
    const displayHelperText = error?.message || helperText;

    switch (componentType) {
      case 'text':
      case 'password':
      case 'email':
      case 'number':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <TextField
                type={
                  componentType === 'password'
                    ? 'password'
                    : componentType === 'email'
                      ? 'email'
                      : componentType === 'number'
                        ? 'number'
                        : 'text'
                }
                id={name}
                label={label}
                {...(placeholder && { placeholder })}
                error={!!error}
                helperText={displayHelperText}
                disabled={!!disabled}
                fullWidth
                {...field}
                {...rest}
              />
            )}
          />
        );
      case 'textarea':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <TextField
                multiline
                rows={4}
                id={name}
                label={label}
                {...(placeholder && { placeholder })}
                error={!!error}
                helperText={displayHelperText}
                disabled={!!disabled}
                fullWidth
                {...field}
                {...rest}
              />
            )}
          />
        );
      case 'select':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!error}>
                <InputLabel id={`${name}-label`}>{label}</InputLabel>
                <Select
                  labelId={`${name}-label`}
                  id={name}
                  label={label}
                  disabled={!!disabled}
                  {...field}
                  {...rest}
                >
                  {placeholder && (
                    <MenuItem value="" disabled>
                      {placeholder}
                    </MenuItem>
                  )}
                  {options?.map((option: { value: string; label: string }) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {displayHelperText && (
                  <FormHelperText>{displayHelperText}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        );
      case 'checkbox':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    {...rest}
                    checked={!!field.value}
                    id={name}
                    disabled={!!disabled}
                  />
                }
                label={label || ''}
              />
            )}
          />
        );
      case 'switch':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    {...rest}
                    checked={!!field.value}
                    id={name}
                    disabled={!!disabled}
                  />
                }
                label={label || ''}
              />
            )}
          />
        );
      default:
        return <div>Unsupported MUI field type: {componentType}</div>;
    }
  },

  renderCustomComponent: (Component, props) => {
    const { name, control, ...rest } = props;
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => <Component {...field} {...rest} />}
      />
    );
  },
};
