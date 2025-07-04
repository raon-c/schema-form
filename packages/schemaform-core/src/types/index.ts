// TypeScript type definitions
// This module contains all the type definitions used throughout the library

// TODO: Implement type definitions
// export * from './common';
// export * from './FieldMetadata';
// export * from './SchemaForm';
// export * from './UIAdapter';

import type { ReactNode } from 'react';
import type { Control, DeepPartial, FieldValues, Mode } from 'react-hook-form';
import type { z } from 'zod/v4';
import type { $ZodType } from 'zod/v4/core';

// Core field metadata interface following architecture specification
export interface FieldMetadata {
  label: string;
  placeholder?: string;
  helperText?: string;
  componentType?:
    | 'password'
    | 'textarea'
    | 'number'
    | 'select'
    | 'switch'
    | 'checkbox'
    | 'radio'
    | 'date'
    | string;
  component?: React.ComponentType<any>;
  validationTrigger?: 'onChange' | 'onBlur';
  disabled?: boolean;
  displayCondition?: (formValues: any) => boolean;
  disabledCondition?: (formValues: any) => boolean;
  [key: string]: any;
}

// Field layout renderer interface
export interface RenderFieldLayoutProps {
  children: ReactNode;
  label: string;
  error?: string;
  helperText?: string;
  meta: FieldMetadata;
}

export type RenderFieldLayout = (props: RenderFieldLayoutProps) => ReactNode;

// Schema form configuration for useSchemaForm hook
export interface SchemaFormConfig<T extends $ZodType> {
  schema: T;
  defaultValues?: DeepPartial<z.output<T>>;
  mode?: Mode;
  control?: Control<FieldValues>;
}

// Form field definition extracted from schema
export interface FormField {
  path: string;
  zodType: $ZodType;
  meta: FieldMetadata;
}

// Core form state management return type
export interface SchemaFormState<T extends $ZodType> {
  control: Control<FieldValues>;
  formState: any;
  handleSubmit: any;
  watch: any;
  trigger: any;
  reset: any;
  setValue: any;
  getValues: any;
}

// Export all core types
export type {
  Control,
  DeepPartial,
  FieldError,
  FieldValues,
  Mode,
} from 'react-hook-form';

export type { z } from 'zod/v4';
export type { $ZodType } from 'zod/v4/core';
