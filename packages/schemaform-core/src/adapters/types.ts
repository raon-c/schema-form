import type { ReactNode } from 'react';
import type { Control, FieldError } from 'react-hook-form';

export type StandardComponentType =
  | 'text'
  | 'password'
  | 'textarea'
  | 'number'
  | 'select'
  | 'switch'
  | 'checkbox'
  | 'radio';

export interface FieldProps {
  name: string;
  control: Control<any>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: FieldError;
  [key: string]: any;
}

export interface UIAdapter {
  renderField: (
    componentType: StandardComponentType | string,
    props: FieldProps
  ) => ReactNode;
  renderCustomComponent?: (
    Component: React.ComponentType<any>,
    props: FieldProps
  ) => ReactNode;
  renderFieldLayout?: (
    field: ReactNode,
    label?: string,
    error?: FieldError,
    name?: string
  ) => ReactNode;
}
