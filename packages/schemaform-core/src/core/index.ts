// Core form engine functionality
// This module contains the main SchemaForm logic and form state management

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { $ZodType } from 'zod/v4/core';
import { useErrorHandling } from '../hooks/useErrorHandling';
import type { FieldValues, SchemaFormConfig, SchemaFormState } from '../types';

/**
 * Core hook for SchemaForm state management
 *
 * This hook serves as the core engine for form state management,
 * providing integration between zod schemas and react-hook-form.
 *
 * Features:
 * - Automatic form state management using react-hook-form
 * - Zod schema validation integration via zodResolver
 * - Support for both controlled and uncontrolled modes
 * - Type-safe form handling
 */
export function useSchemaForm<T extends $ZodType>(
  config: SchemaFormConfig<T>
): SchemaFormState<T> {
  const {
    schema,
    defaultValues,
    mode = 'onSubmit',
    control: externalControl,
    errorMessages,
    errorDisplayOptions,
    onError,
  } = config;

  // Enhanced error handling
  const { errors, clearFieldError, clearAllErrors } = useErrorHandling({
    errorMessages,
    errorDisplayOptions,
    onError,
  });

  // Always call useForm to comply with React hooks rules
  const form = useForm<FieldValues>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as any,
    mode,
  });

  // If external control is provided, use controlled mode
  if (externalControl) {
    return {
      control: externalControl,
      formState: {},
      handleSubmit: (_onSubmit: any) => (e: any) => e.preventDefault(),
      watch: () => ({}),
      trigger: () => Promise.resolve(true),
      reset: () => {},
      setValue: () => {},
      getValues: () => ({}),
      errors,
      clearFieldError,
      clearAllErrors,
      validateField: async () => Promise.resolve(true),
      validateForm: async () => Promise.resolve(true),
    };
  }

  // Uncontrolled mode: use internal form state
  return {
    control: form.control,
    formState: form.formState,
    handleSubmit: form.handleSubmit,
    watch: form.watch,
    trigger: form.trigger,
    reset: form.reset,
    setValue: form.setValue,
    getValues: form.getValues,
    errors,
    clearFieldError,
    clearAllErrors,
    validateField: async (fieldPath: string) => {
      return form.trigger(fieldPath);
    },
    validateForm: async () => {
      return form.trigger();
    },
  };
}

/**
 * Creates a zod resolver for form validation
 *
 * This utility function creates a zodResolver that can be used
 * with react-hook-form for schema-based validation.
 */
export function createSchemaResolver<T extends $ZodType>(schema: T) {
  return zodResolver(schema as any);
}

/**
 * Type guard to check if form is in controlled mode
 */
export function isControlledMode<T extends $ZodType>(
  config: SchemaFormConfig<T>
): boolean {
  return !!config.control;
}

// Re-export SchemaForm component as the main entry point
export { SchemaForm } from '../components/SchemaForm';
// Export core types and utilities
export type {
  FieldMetadata,
  FormField,
  SchemaFormConfig,
  SchemaFormState,
} from '../types';
export {
  AccessibilityManager,
  cleanupGlobalAccessibilityManager,
  createAccessibilityManager,
  getAccessibilityManager,
} from '../utils/AccessibilityManager';
export { createErrorManager, ErrorManager } from '../utils/ErrorManager';
export {
  AsyncValidationManager,
  createAsyncValidationManager,
  getAsyncValidationManager,
  cleanupGlobalAsyncValidationManager,
} from '../utils/AsyncValidationManager';
export {
  ValidationCacheManager,
  createValidationCacheManager,
  getValidationCacheManager,
  cleanupGlobalValidationCacheManager,
} from '../utils/ValidationCacheManager';
export {
  createErrorMap,
  extractFieldsFromSchema,
  getComponentTypeFromZodType,
} from '../utils/schema';
