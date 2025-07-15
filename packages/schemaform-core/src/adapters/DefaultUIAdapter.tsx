import { Controller } from 'react-hook-form';
import type { UIAdapter } from './types';

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
      ...rest
    } = props;

    switch (componentType) {
      case 'text':
      case 'password':
      case 'email':
      case 'url':
      case 'tel':
      case 'search':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <input
                type={componentType === 'search' ? 'search' : componentType}
                id={name}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                {...field}
                {...rest}
                className={error ? 'error' : ''}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${name}-error` : undefined}
              />
            )}
          />
        );

      case 'number':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                id={name}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                {...field}
                {...rest}
                className={error ? 'error' : ''}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${name}-error` : undefined}
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
              <textarea
                id={name}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                rows={4}
                {...field}
                {...rest}
                className={error ? 'error' : ''}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${name}-error` : undefined}
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
              <select
                id={name}
                disabled={disabled}
                required={required}
                {...field}
                {...rest}
                className={error ? 'error' : ''}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${name}-error` : undefined}
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
        );

      case 'radio':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <div
                className="radio-group"
                role="radiogroup"
                aria-labelledby={`${name}-label`}
              >
                {options?.map(option => (
                  <label key={option.value} className="radio-option">
                    <input
                      type="radio"
                      value={option.value}
                      checked={field.value === option.value}
                      onChange={() => field.onChange(option.value)}
                      disabled={disabled}
                      required={required}
                      {...rest}
                      aria-describedby={error ? `${name}-error` : undefined}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          />
        );

      case 'checkbox':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id={name}
                  disabled={disabled}
                  required={required}
                  {...field}
                  {...rest}
                  checked={!!field.value}
                  className={error ? 'error' : ''}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? `${name}-error` : undefined}
                />
                <span className="checkbox-label">{rest.label}</span>
              </label>
            )}
          />
        );

      case 'switch':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <label className="switch-wrapper">
                <input
                  type="checkbox"
                  id={name}
                  disabled={disabled}
                  required={required}
                  {...field}
                  {...rest}
                  checked={!!field.value}
                  className={`switch ${error ? 'error' : ''}`}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? `${name}-error` : undefined}
                />
                <span className="switch-slider"></span>
                <span className="switch-label">{rest.label}</span>
              </label>
            )}
          />
        );

      case 'date':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <input
                type="date"
                id={name}
                disabled={disabled}
                required={required}
                {...field}
                {...rest}
                className={error ? 'error' : ''}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${name}-error` : undefined}
              />
            )}
          />
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

  renderFieldLayout: ({ children, label, error, helperText, meta }) => {
    return (
      <div className="sf-field-container">
        {label && <label htmlFor={meta?.name || ''}>{label}</label>}
        {children}
        {helperText && <div className="sf-helper-text">{helperText}</div>}
        {error && <div className="sf-error-message">{error.message}</div>}
      </div>
    );
  },
};
