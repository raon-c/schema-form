import { Controller } from 'react-hook-form';
import type { UIAdapter } from './types';

export const DefaultUIAdapter: UIAdapter = {
  renderField: (componentType, props) => {
    const { name, control, error, ...rest } = props;

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
              <input
                type={componentType}
                id={name}
                {...field}
                {...rest}
                className={error ? 'error' : ''}
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
                {...field}
                {...rest}
                className={error ? 'error' : ''}
              />
            )}
          />
        );
      case 'checkbox':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                id={name}
                {...field}
                {...rest}
                checked={field.value}
                className={error ? 'error' : ''}
              />
            )}
          />
        );
      default:
        return <div>Unsupported field type: {componentType}</div>;
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

  renderFieldLayout: (field, label, error, name) => {
    return (
      <div className="sf-field-container">
        {label && <label htmlFor={name}>{label}</label>}
        {field}
        {error && <div className="sf-error-message">{error.message}</div>}
      </div>
    );
  },
};
