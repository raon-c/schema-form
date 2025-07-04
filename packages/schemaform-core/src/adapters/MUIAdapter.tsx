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

// Props that should not be passed to DOM elements
const DOM_EXCLUDED_PROPS = [
  'validationTrigger',
  'componentType',
  'displayCondition',
  'disabledCondition',
  'showErrorOnTouch',
  'clearErrorOnFocus',
  'errorMessage',
  'meta',
];

// Filter out custom props that shouldn't be passed to DOM elements
function filterDOMProps(props: Record<string, any>) {
  const filtered = { ...props };
  DOM_EXCLUDED_PROPS.forEach(prop => {
    delete filtered[prop];
  });
  return filtered;
}

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
      meta,
      ...rest
    } = props;

    // Filter out DOM-incompatible props
    const domProps = filterDOMProps(rest);

    // Simple error message handling
    const displayHelperText = error ? error.message : helperText;

    // Error styling
    const hasError = !!error;

    switch (componentType) {
      case 'text':
      case 'password':
      case 'email':
      case 'number':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
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
                error={hasError || fieldState.invalid}
                helperText={displayHelperText || fieldState.error?.message}
                disabled={!!disabled}
                fullWidth
                {...field}
                {...domProps}
                // Enhanced error handling props
                onFocus={e => {
                  // Clear error on focus if specified in meta
                  if (meta?.clearErrorOnFocus && hasError) {
                    // This would be handled by the form's error management
                  }
                  domProps.onFocus?.(e);
                }}
                onBlur={e => {
                  field.onBlur();
                  domProps.onBlur?.(e);
                }}
              />
            )}
          />
        );

      case 'textarea':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                multiline
                rows={4}
                id={name}
                label={label}
                {...(placeholder && { placeholder })}
                error={hasError || fieldState.invalid}
                helperText={displayHelperText || fieldState.error?.message}
                disabled={!!disabled}
                fullWidth
                {...field}
                {...domProps}
              />
            )}
          />
        );

      case 'select':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={hasError || fieldState.invalid}>
                <InputLabel id={`${name}-label`}>{label}</InputLabel>
                <Select
                  labelId={`${name}-label`}
                  id={name}
                  label={label}
                  disabled={!!disabled}
                  {...field}
                  {...domProps}
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
                {(displayHelperText || fieldState.error?.message) && (
                  <FormHelperText>
                    {displayHelperText || fieldState.error?.message}
                  </FormHelperText>
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
            render={({ field, fieldState }) => (
              <FormControl error={hasError || fieldState.invalid}>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      {...domProps}
                      checked={!!field.value}
                      id={name}
                      disabled={!!disabled}
                    />
                  }
                  label={label || ''}
                />
                {(displayHelperText || fieldState.error?.message) && (
                  <FormHelperText>
                    {displayHelperText || fieldState.error?.message}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
        );

      case 'switch':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
              <FormControl error={hasError || fieldState.invalid}>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      {...domProps}
                      checked={!!field.value}
                      id={name}
                      disabled={!!disabled}
                    />
                  }
                  label={label || ''}
                />
                {(displayHelperText || fieldState.error?.message) && (
                  <FormHelperText>
                    {displayHelperText || fieldState.error?.message}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
        );

      default:
        return <div>Unsupported MUI field type: {componentType}</div>;
    }
  },

  renderCustomComponent: (Component, props) => {
    const { name, control, ...rest } = props;
    // Filter DOM props for custom components too
    const domProps = filterDOMProps(rest);
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => <Component {...field} {...domProps} />}
      />
    );
  },
};
