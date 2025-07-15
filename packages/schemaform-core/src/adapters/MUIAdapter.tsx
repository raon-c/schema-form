import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Controller } from 'react-hook-form';
import type { UIAdapter, FieldProps } from './types';

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
  'isValidating',
  'ariaLabel',
  'ariaDescribedBy',
  'onFocus',
  'onBlur',
  'onChange',
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
      required,
      isValidating,
      ariaLabel,
      ariaDescribedBy,
      meta,
      onFocus,
      onBlur,
      onChange,
      ...rest
    } = props;

    // Filter out DOM-incompatible props
    const domProps = filterDOMProps(rest);

    // Enhanced error message handling
    const displayHelperText = error ? error.message : helperText;

    // Error styling
    const hasError = !!error;

    // Enhanced accessibility attributes
    const getAccessibilityProps = () => {
      const describedBy = ariaDescribedBy || meta?.ariaDescribedBy;
      return {
        'aria-label': ariaLabel || meta?.ariaLabel,
        ...(describedBy && { 'aria-describedby': describedBy }),
        'aria-required': required ? true : undefined,
      };
    };

    // Loading indicator for async validation
    const LoadingAdornment = () => (
      isValidating ? (
        <InputAdornment position="end">
          <CircularProgress size={20} />
        </InputAdornment>
      ) : null
    );

    // Enhanced event handlers
    const handleFocus = (event: React.FocusEvent) => {
      onFocus?.(event);
      // Clear error on focus if specified in meta
      if (meta?.clearErrorOnFocus && hasError) {
        // This would be handled by the form's error management
      }
    };

    const handleBlur = (event: React.FocusEvent) => {
      onBlur?.(event);
    };

    const handleChange = (value: any) => {
      onChange?.(value);
    };

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
                placeholder={placeholder || ''}
                error={hasError || fieldState.invalid}
                helperText={displayHelperText || fieldState.error?.message}
                disabled={!!(disabled || isValidating)}
                required={!!required}
                fullWidth
                {...field}
                {...getAccessibilityProps()}
                InputProps={{
                  endAdornment: <LoadingAdornment />,
                }}
                onFocus={(e) => {
                  handleFocus(e);
                }}
                onBlur={(e) => {
                  field.onBlur();
                  handleBlur(e);
                }}
                onChange={(e) => {
                  field.onChange(e);
                  handleChange(e.target.value);
                }}
                {...domProps}
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
                placeholder={placeholder || ''}
                error={hasError || fieldState.invalid}
                helperText={displayHelperText || fieldState.error?.message}
                disabled={!!(disabled || isValidating)}
                required={!!required}
                fullWidth
                {...field}
                {...getAccessibilityProps()}
                InputProps={{
                  endAdornment: <LoadingAdornment />,
                }}
                onFocus={(e) => {
                  handleFocus(e);
                }}
                onBlur={(e) => {
                  field.onBlur();
                  handleBlur(e);
                }}
                onChange={(e) => {
                  field.onChange(e);
                  handleChange(e.target.value);
                }}
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
                  disabled={!!(disabled || isValidating)}
                  required={!!required}
                  {...field}
                  {...getAccessibilityProps()}
                  endAdornment={isValidating ? (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : undefined}
                  onFocus={(e) => {
                    handleFocus(e);
                  }}
                  onBlur={(e) => {
                    field.onBlur();
                    handleBlur(e);
                  }}
                  onChange={(e) => {
                    field.onChange(e);
                    handleChange(e.target.value);
                  }}
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
                {isValidating && (
                  <FormHelperText>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={16} />
                      <Typography variant="caption">Validating...</Typography>
                    </Box>
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
                <Box display="flex" alignItems="center" gap={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        {...getAccessibilityProps()}
                        checked={!!field.value}
                        id={name}
                        disabled={!!(disabled || isValidating)}
                        required={!!required}
                        onFocus={(e) => {
                          handleFocus(e);
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          handleBlur(e);
                        }}
                        onChange={(e) => {
                          field.onChange(e.target.checked);
                          handleChange(e.target.checked);
                        }}
                        {...domProps}
                      />
                    }
                    label={label || ''}
                  />
                  {isValidating && <CircularProgress size={20} />}
                </Box>
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
                <Box display="flex" alignItems="center" gap={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        {...field}
                        {...getAccessibilityProps()}
                        checked={!!field.value}
                        id={name}
                        disabled={!!(disabled || isValidating)}
                        required={!!required}
                        onFocus={(e) => {
                          handleFocus(e);
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          handleBlur(e);
                        }}
                        onChange={(e) => {
                          field.onChange(e.target.checked);
                          handleChange(e.target.checked);
                        }}
                        {...domProps}
                      />
                    }
                    label={label || ''}
                  />
                  {isValidating && <CircularProgress size={20} />}
                </Box>
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
                <Box>
                  {label && (
                    <Typography
                      component="legend"
                      id={`${name}-label`}
                      variant="body2"
                      sx={{ marginBottom: 1, fontWeight: 500 }}
                    >
                      {label}
                      {required && <span style={{ color: 'red' }}> *</span>}
                    </Typography>
                  )}
                  <RadioGroup
                    {...field}
                    {...getAccessibilityProps()}
                    aria-labelledby={`${name}-label`}
                    name={name}
                    onFocus={(e) => {
                      handleFocus(e);
                    }}
                    onBlur={(e) => {
                      field.onBlur();
                      handleBlur(e);
                    }}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleChange(e.target.value);
                    }}
                  >
                    {options?.map((option: { value: string; label: string }) => (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={
                          <Radio
                            disabled={!!(disabled || isValidating)}
                            required={!!required}
                          />
                        }
                        label={option.label}
                      />
                    ))}
                  </RadioGroup>
                  {isValidating && (
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <CircularProgress size={16} />
                      <Typography variant="caption">Validating...</Typography>
                    </Box>
                  )}
                </Box>
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
                disabled={!!(disabled || isValidating)}
                required={!!required}
                fullWidth
                {...field}
                {...getAccessibilityProps()}
                InputProps={{
                  endAdornment: <LoadingAdornment />,
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                onFocus={(e) => {
                  handleFocus(e);
                }}
                onBlur={(e) => {
                  field.onBlur();
                  handleBlur(e);
                }}
                onChange={(e) => {
                  field.onChange(e);
                  handleChange(e.target.value);
                }}
                {...domProps}
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

  renderFieldLayout: ({ children, label, error, helperText, meta, errorState }) => {
    const fieldId = meta?.name || '';
    const hasError = !!error;
    const isValidating = errorState?.isValidating || false;
    
    return (
      <Box sx={{ marginBottom: 2 }}>
        {children}
        {/* Additional validation status for complex fields */}
        {isValidating && !error && (
          <FormHelperText>
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Validating field...
              </Typography>
            </Box>
          </FormHelperText>
        )}
      </Box>
    );
  },

  renderFormContainer: (children, props) => {
    const { onSubmit, className = '', style, ...rest } = props;
    
    return (
      <Box
        component="form"
        onSubmit={onSubmit}
        className={className}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
        style={style}
        noValidate // We handle validation ourselves
        {...rest}
      >
        {children}
      </Box>
    );
  },

  renderErrorMessage: (error, fieldName) => {
    return (
      <FormHelperText error>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" component="span" sx={{ fontSize: '1rem' }}>
            ⚠
          </Typography>
          <Typography variant="body2" component="span">
            {error.message}
          </Typography>
        </Box>
      </FormHelperText>
    );
  },
};
