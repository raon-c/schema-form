import React from 'react';
import { Controller } from 'react-hook-form';
import type { UIAdapter, FieldProps } from './types';

export const DefaultUIAdapter: UIAdapter = {
  renderField: (componentType, props) => {
    const {
      name,
      control,
      error,
      options,
      placeholder,
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

    // Enhanced accessibility attributes
    const getAccessibilityProps = () => {
      const errorId = error ? `${name}-error` : undefined;
      const helperId = meta?.helperText ? `${name}-helper` : undefined;
      const describedByIds = [
        ariaDescribedBy,
        errorId,
        helperId,
        isValidating ? `${name}-loading` : undefined,
      ].filter(Boolean).join(' ') || undefined;

      return {
        'aria-label': ariaLabel || meta?.ariaLabel,
        'aria-describedby': describedByIds,
        'aria-invalid': error ? ('true' as const) : ('false' as const),
        'aria-required': required ? ('true' as const) : undefined,
      };
    };

    // Loading indicator component
    const LoadingIndicator = () => (
      isValidating ? (
        <span 
          id={`${name}-loading`}
          className="sf-loading-indicator"
          aria-live="polite"
          role="status"
        >
          <span className="sf-spinner" aria-hidden="true"></span>
          <span className="sr-only">Validating...</span>
        </span>
      ) : null
    );

    // Enhanced event handlers
    const handleFocus = (event: React.FocusEvent) => {
      onFocus?.(event);
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
        return (
          <div className="sf-input-wrapper">
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <input
                  type={componentType === 'search' ? 'search' : componentType}
                  id={name}
                  placeholder={placeholder}
                  disabled={disabled || isValidating}
                  required={required}
                  {...field}
                  {...getAccessibilityProps()}
                  className={`sf-input ${error ? 'sf-input--error' : ''} ${isValidating ? 'sf-input--validating' : ''}`}
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
                />
              )}
            />
            <LoadingIndicator />
          </div>
        );

      case 'number':
        return (
          <div className="sf-input-wrapper">
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  id={name}
                  placeholder={placeholder}
                  disabled={disabled || isValidating}
                  required={required}
                  {...field}
                  {...getAccessibilityProps()}
                  className={`sf-input sf-input--number ${error ? 'sf-input--error' : ''} ${isValidating ? 'sf-input--validating' : ''}`}
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
                />
              )}
            />
            <LoadingIndicator />
          </div>
        );

      case 'textarea':
        return (
          <div className="sf-textarea-wrapper">
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <textarea
                  id={name}
                  placeholder={placeholder}
                  disabled={disabled || isValidating}
                  required={required}
                  rows={4}
                  {...field}
                  {...getAccessibilityProps()}
                  className={`sf-textarea ${error ? 'sf-textarea--error' : ''} ${isValidating ? 'sf-textarea--validating' : ''}`}
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
                />
              )}
            />
            <LoadingIndicator />
          </div>
        );

      case 'select':
        return (
          <div className="sf-select-wrapper">
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <select
                  id={name}
                  disabled={disabled || isValidating}
                  required={required}
                  {...field}
                  {...getAccessibilityProps()}
                  className={`sf-select ${error ? 'sf-select--error' : ''} ${isValidating ? 'sf-select--validating' : ''}`}
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
                >
                  {placeholder && (
                    <option value="" disabled>
                      {placeholder}
                    </option>
                  )}
                  {options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
            <LoadingIndicator />
          </div>
        );

      case 'radio':
        return (
          <div className="sf-radio-wrapper">
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div
                  className={`sf-radio-group ${error ? 'sf-radio-group--error' : ''} ${isValidating ? 'sf-radio-group--validating' : ''}`}
                  role="radiogroup"
                  aria-labelledby={`${name}-label`}
                  {...getAccessibilityProps()}
                >
                  {options?.map((option, index) => (
                    <label key={option.value} className="sf-radio-option">
                      <input
                        type="radio"
                        name={name}
                        value={option.value}
                        checked={field.value === option.value}
                        disabled={disabled || isValidating}
                        required={required && index === 0} // Only first radio needs required
                        onChange={(e) => {
                          field.onChange(option.value);
                          handleChange(option.value);
                        }}
                        onFocus={handleFocus}
                        onBlur={(e) => {
                          field.onBlur();
                          handleBlur(e);
                        }}
                        {...rest}
                      />
                      <span className="sf-radio-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            />
            <LoadingIndicator />
          </div>
        );

      case 'checkbox':
        return (
          <div className="sf-checkbox-wrapper">
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <label className={`sf-checkbox-label ${error ? 'sf-checkbox-label--error' : ''} ${isValidating ? 'sf-checkbox-label--validating' : ''}`}>
                  <input
                    type="checkbox"
                    id={name}
                    disabled={disabled || isValidating}
                    required={required}
                    {...field}
                    {...getAccessibilityProps()}
                    checked={!!field.value}
                    className="sf-checkbox"
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
                  />
                  <span className="sf-checkbox-checkmark" aria-hidden="true"></span>
                  <span className="sf-checkbox-text">{meta?.label || rest.label}</span>
                </label>
              )}
            />
            <LoadingIndicator />
          </div>
        );

      case 'switch':
        return (
          <div className="sf-switch-wrapper">
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <label className={`sf-switch-label ${error ? 'sf-switch-label--error' : ''} ${isValidating ? 'sf-switch-label--validating' : ''}`}>
                  <input
                    type="checkbox"
                    id={name}
                    disabled={disabled || isValidating}
                    required={required}
                    {...field}
                    {...getAccessibilityProps()}
                    checked={!!field.value}
                    className="sf-switch"
                    role="switch"
                    aria-checked={!!field.value}
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
                    {...rest}
                  />
                  <span className="sf-switch-slider" aria-hidden="true"></span>
                  <span className="sf-switch-text">{meta?.label || rest.label}</span>
                </label>
              )}
            />
            <LoadingIndicator />
          </div>
        );

      case 'date':
        return (
          <div className="sf-input-wrapper">
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <input
                  type="date"
                  id={name}
                  disabled={disabled || isValidating}
                  required={required}
                  {...field}
                  {...getAccessibilityProps()}
                  className={`sf-input sf-input--date ${error ? 'sf-input--error' : ''} ${isValidating ? 'sf-input--validating' : ''}`}
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
                  {...rest}
                />
              )}
            />
            <LoadingIndicator />
          </div>
        );

      case 'custom':
        // This should be handled by renderCustomComponent, but provide fallback
        return (
          <div className="custom-component-placeholder">
            Custom component not rendered
          </div>
        );

      case 'object':
        // Objects need special handling - could be enhanced with nested form rendering
        return (
          <div className="object-field-placeholder">
            Object field (nested form needed)
          </div>
        );

      default:
        // Enhanced fallback with better error information
        return (
          <div className="unsupported-field-type">
            <p>
              Unsupported field type: <code>{componentType}</code>
            </p>
            <p>
              Field name: <code>{name}</code>
            </p>
            <details>
              <summary>Debug Info</summary>
              <pre>{JSON.stringify(props, null, 2)}</pre>
            </details>
          </div>
        );
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

  renderFieldLayout: ({ children, label, error, helperText, meta, errorState }) => {
    const fieldId = meta?.name || '';
    const errorId = error ? `${fieldId}-error` : undefined;
    const helperId = helperText ? `${fieldId}-helper` : undefined;
    
    return (
      <div className={`sf-field-container ${error ? 'sf-field-container--error' : ''} ${errorState?.isValidating ? 'sf-field-container--validating' : ''}`}>
        {label && (
          <label 
            htmlFor={fieldId}
            className={`sf-field-label ${meta?.required ? 'sf-field-label--required' : ''}`}
            id={`${fieldId}-label`}
          >
            {label}
            {meta?.required && (
              <span className="sf-required-indicator" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        <div className="sf-field-input-container">
          {children}
        </div>
        
        {helperText && (
          <div 
            id={helperId}
            className="sf-helper-text"
            role="note"
          >
            {helperText}
          </div>
        )}
        
        {error && (
          <div 
            id={errorId}
            className="sf-error-message"
            role="alert"
            aria-live="polite"
          >
            <span className="sf-error-icon" aria-hidden="true">⚠</span>
            {error.message}
          </div>
        )}
        
        {errorState?.isValidating && (
          <div 
            className="sf-validation-status"
            aria-live="polite"
            role="status"
          >
            <span className="sf-validation-spinner" aria-hidden="true"></span>
            <span className="sr-only">Validating field...</span>
          </div>
        )}
      </div>
    );
  },

  renderFormContainer: (children, props) => {
    const { onSubmit, className = '', style, ...rest } = props;
    
    return (
      <form
        onSubmit={onSubmit}
        className={`sf-form ${className}`}
        style={style}
        noValidate // We handle validation ourselves
        {...rest}
      >
        {children}
      </form>
    );
  },

  renderErrorMessage: (error, fieldName) => {
    return (
      <div 
        className="sf-standalone-error"
        role="alert"
        aria-live="polite"
      >
        <span className="sf-error-icon" aria-hidden="true">⚠</span>
        <span className="sf-error-text">{error.message}</span>
      </div>
    );
  },
};
