// TypeScript type definitions
// This module contains all the type definitions used throughout the library

// TODO: Implement type definitions
// export * from './common';
// export * from './FieldMetadata';
// export * from './SchemaForm';
// export * from './UIAdapter';

import type { ReactNode } from 'react';
import type {
  Control,
  DeepPartial,
  FieldError,
  FieldValues,
  Mode,
} from 'react-hook-form';
import type { z } from 'zod/v4';
import type { $ZodType } from 'zod/v4/core';

// Enhanced error handling types
export interface FormError {
  message: string;
  type: string;
  path: string;
  code?: string;
}

export interface FieldErrorState {
  hasError: boolean;
  error?: FieldError | undefined;
  isDirty: boolean;
  isTouched: boolean;
}

export interface FormErrorState {
  [fieldPath: string]: FieldErrorState;
}

export interface ErrorDisplayOptions {
  showErrorsOnTouch?: boolean;
  showErrorsOnSubmit?: boolean;
  showErrorsOnBlur?: boolean;
  showErrorsOnChange?: boolean;
  clearErrorsOnFocus?: boolean;
  errorDisplayDelay?: number;
}

// Error message customization
export interface ErrorMessages {
  required?: string | ((fieldName: string) => string);
  invalid?: string | ((fieldName: string, type: string) => string);
  tooShort?: string | ((fieldName: string, min: number) => string);
  tooLong?: string | ((fieldName: string, max: number) => string);
  pattern?: string | ((fieldName: string) => string);
  email?: string | ((fieldName: string) => string);
  url?: string | ((fieldName: string) => string);
  number?: string | ((fieldName: string) => string);
  custom?: Record<string, string | ((value: any, fieldName: string) => string)>;
}

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
  validationTrigger?: 'onChange' | 'onBlur' | 'onSubmit';
  disabled?: boolean;
  displayCondition?: (formValues: any) => boolean;
  disabledCondition?: (formValues: any) => boolean;
  // Enhanced error handling for fields
  errorMessage?: string | ((error: FieldError, fieldName: string) => string);
  showErrorOnTouch?: boolean;
  clearErrorOnFocus?: boolean;
  [key: string]: any;
}

// Field layout renderer interface
export interface RenderFieldLayoutProps {
  children: ReactNode;
  label: string;
  error?: FieldError;
  helperText?: string;
  meta: FieldMetadata;
  errorState?: FieldErrorState;
}

export type RenderFieldLayout = (props: RenderFieldLayoutProps) => ReactNode;

// Enhanced schema form configuration
export interface SchemaFormConfig<T extends $ZodType> {
  schema: T;
  defaultValues?: DeepPartial<z.output<T>>;
  mode?: Mode;
  control?: Control<FieldValues>;
  // Enhanced error handling configuration
  errorMessages?: ErrorMessages;
  errorDisplayOptions?: ErrorDisplayOptions;
  onError?: (errors: FormErrorState) => void;
  validateOnMount?: boolean;
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
  // Enhanced error handling state
  errors: FormErrorState;
  clearFieldError: (fieldPath: string) => void;
  clearAllErrors: () => void;
  validateField: (fieldPath: string) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
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
