// TypeScript type definitions
// This module contains all the type definitions used throughout the library

import type React from 'react';
import type { FocusEvent, ReactNode } from 'react';

import type {
  Control,
  DeepPartial,
  FieldError,
  FieldValues,
  Mode,
} from 'react-hook-form';
import type { z } from 'zod/v4';
import type { $ZodType } from 'zod/v4/core';

// Standard component types supported by adapters
export type StandardComponentType =
  | 'text'
  | 'password'
  | 'textarea'
  | 'number'
  | 'select'
  | 'switch'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'email'
  | 'url'
  | 'tel'
  | 'search';

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
  isValidating: boolean;
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
  groupErrors?: boolean;
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

// Forward declaration for circular reference
export interface FieldProps {
  // react-hook-form integration
  name: string;
  control: Control<any>;

  // Field metadata from schema
  label?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;

  // Validation and errors
  error?: FieldError;
  isValidating?: boolean;

  // Field-specific data
  options?: Array<{ value: string; label: string }>;
  meta?: FieldMetadata;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;

  // Event handlers
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onChange?: (value: any) => void;
}

// Core field metadata interface following architecture specification
export interface FieldMetadata {
  // Basic UI metadata
  label: string;
  placeholder?: string;
  helperText?: string;

  // Component specification
  componentType?: StandardComponentType | string;
  component?: React.ComponentType<FieldProps>;

  // Validation behavior
  validationTrigger?: 'onChange' | 'onBlur' | 'onSubmit';

  // Conditional rendering
  displayCondition?: (formValues: any) => boolean;
  disabledCondition?: (formValues: any) => boolean;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;

  // Error handling
  errorMessage?: string | ((error: FieldError) => string);
  showErrorOnTouch?: boolean;
  clearErrorOnFocus?: boolean;

  // Custom properties
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
  path: string; // Field path (e.g., "user.email")
  zodType: $ZodType; // Original Zod type
  meta: FieldMetadata; // Extracted metadata
  isOptional: boolean; // Whether field is optional
  defaultValue?: any; // Default value if specified
}

// Async validation state tracking
export interface AsyncValidationState {
  validatingFields: Set<string>;
  validationPromises: Map<string, Promise<boolean>>;
  validationResults: Map<string, ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  timestamp: number;
}

// UI Adapter interface for rendering different field types and layouts
export interface UIAdapter {
  // Core field rendering
  renderField: (
    componentType: StandardComponentType | string,
    props: FieldProps
  ) => ReactNode;

  // Custom component support
  renderCustomComponent?: (
    Component: React.ComponentType<any>,
    props: FieldProps
  ) => ReactNode;

  // Layout customization
  renderFieldLayout?: RenderFieldLayout;

  // Form-level rendering
  renderFormContainer?: (
    children: ReactNode,
    props: FormContainerProps
  ) => ReactNode;

  // Error display customization
  renderErrorMessage?: (error: FieldError, fieldName: string) => ReactNode;
}

// Form container props for form-level rendering
export interface FormContainerProps {
  children: ReactNode;
  onSubmit?: (event: React.FormEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

// SchemaForm component ref interface for imperative control
export interface SchemaFormRef<T extends $ZodType = $ZodType> {
  // Form control methods
  reset: (values?: DeepPartial<z.output<T>>) => void;
  clear: () => void;

  // Validation methods
  validate: () => Promise<boolean>;
  validateField: (fieldName: string) => Promise<boolean>;

  // Form state access
  getValues: () => z.output<T>;
  getValue: (fieldName: string) => any;
  setValue: (fieldName: string, value: any) => void;

  // Error management
  setError: (fieldName: string, error: FieldError) => void;
  clearError: (fieldName: string) => void;
  clearAllErrors: () => void;

  // Form submission
  submit: () => void;

  // Focus management
  focusField: (fieldName: string) => void;
}

// Main SchemaForm component props interface
export interface SchemaFormProps<T extends $ZodType> {
  // Core props
  schema: T;
  onSubmit: (data: z.output<T>) => void | Promise<void>;
  uiAdapter: UIAdapter;

  // Form configuration
  defaultValues?: DeepPartial<z.output<T>>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';

  // Controlled mode
  control?: Control<
    z.output<T> extends FieldValues ? z.output<T> : FieldValues
  >;

  // Customization
  renderFieldLayout?: RenderFieldLayout;

  // Error handling
  errorMessages?: ErrorMessages;
  errorDisplayOptions?: ErrorDisplayOptions;
  onError?: (errors: FormErrorState) => void;

  // Accessibility
  formAriaLabel?: string;
  formAriaDescribedBy?: string;

  // Advanced features
  validateOnMount?: boolean;
  resetOnSubmit?: boolean;

  // Form control refs
  formRef?: React.RefObject<SchemaFormRef<T>>;
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
