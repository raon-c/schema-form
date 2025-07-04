import type { ReactNode } from 'react';
import type { Control, FieldError } from 'react-hook-form';
import type { FieldMetadata } from '../types';

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
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
  meta?: FieldMetadata;
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
