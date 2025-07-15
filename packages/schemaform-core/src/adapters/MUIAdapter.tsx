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
      case 'url':
      case 'tel':
      case 'search':
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
                      : componentType === 'url'
                        ? 'url'
                        : componentType === 'tel'
                          ? 'tel'
                          : componentType === 'search'
                            ? 'search'
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

      case 'radio':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
              <FormControl error={hasError || fieldState.invalid}>
                <div role="radiogroup" aria-labelledby={`${name}-label`}>
                  {label && (
                    <div
                      id={`${name}-label`}
                      style={{ marginBottom: 8, fontWeight: 500 }}
                    >
                      {label}
                    </div>
                  )}
                  {options?.map((option: { value: string; label: string }) => (
                    <FormControlLabel
                      key={option.value}
                      control={
                        <input
                          type="radio"
                          value={option.value}
                          checked={field.value === option.value}
                          onChange={() => field.onChange(option.value)}
                          disabled={!!disabled}
                          {...domProps}
                        />
                      }
                      label={option.label}
                    />
                  ))}
                </div>
                {(displayHelperText || fieldState.error?.message) && (
                  <FormHelperText>
                    {displayHelperText || fieldState.error?.message}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
        );

      case 'date':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                type="date"
                id={name}
                label={label}
                error={hasError || fieldState.invalid}
                helperText={displayHelperText || fieldState.error?.message}
                disabled={!!disabled}
                fullWidth
                {...field}
                {...domProps}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            )}
          />
        );

      case 'custom':
        // This should be handled by renderCustomComponent, but provide fallback
        return (
          <div
            style={{ padding: 16, border: '1px dashed #ccc', borderRadius: 4 }}
          >
            <p>Custom component not rendered</p>
            <p>
              Field: <code>{name}</code>
            </p>
          </div>
        );

      case 'object':
        // Objects need special handling - could be enhanced with nested form rendering
        return (
          <div
            style={{
              padding: 16,
              border: '1px solid #e0e0e0',
              borderRadius: 4,
              backgroundColor: '#f5f5f5',
            }}
          >
            <p>Object field (nested form needed)</p>
            <p>
              Field: <code>{name}</code>
            </p>
          </div>
        );

      default:
        // Enhanced fallback with better error information for MUI
        return (
          <div
            style={{
              padding: 16,
              border: '1px solid #f44336',
              borderRadius: 4,
              backgroundColor: '#ffebee',
            }}
          >
            <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
              Unsupported MUI field type: <code>{componentType}</code>
            </p>
            <p>
              Field name: <code>{name}</code>
            </p>
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', color: '#1976d2' }}>
                Debug Info
              </summary>
              <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: 8 }}>
                {JSON.stringify(props, null, 2)}
              </pre>
            </details>
          </div>
        );
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
