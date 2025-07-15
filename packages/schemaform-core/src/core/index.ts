// Core form engine functionality
// This module contains the main SchemaForm logic and form state management

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
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
    validateOnMount = false,
  } = config;

  // Enhanced control detection
  const isControlled = React.useMemo(() => {
    return externalControl !== undefined && externalControl !== null;
  }, [externalControl]);

  // Enhanced error handling
  const { errors, clearFieldError, clearAllErrors } = useErrorHandling({
    errorMessages,
    errorDisplayOptions,
    onError,
  });

  // Always call useForm to comply with React hooks rules, but conditionally use it
  const internalForm = useForm<FieldValues>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as any,
    mode,
  });

  // Handle validateOnMount for internal form
  React.useEffect(() => {
    if (!isControlled && validateOnMount) {
      internalForm.trigger();
    }
  }, [isControlled, validateOnMount, internalForm.trigger]);

  // Enhanced controlled mode handling
  if (isControlled && externalControl) {
    // Get form state from external control if available
    const externalFormState = (externalControl as any)?._formState || {};
    const externalFormValues = externalFormState.values || {};
    const externalFormErrors = externalFormState.errors || {};

    return {
      control: externalControl,
      formState: externalFormState,
      handleSubmit: (onSubmit: any) => {
        if (externalControl && 'handleSubmit' in externalControl) {
          return (externalControl as any).handleSubmit(onSubmit);
        }
        return (e: any) => {
          e?.preventDefault();
          onSubmit(externalFormValues);
        };
      },
      watch: (name?: string) => {
        if (externalControl && 'watch' in externalControl) {
          return (externalControl as any).watch(name);
        }
        return name ? externalFormValues[name] : externalFormValues;
      },
      trigger: (name?: string | string[]) => {
        if (externalControl && 'trigger' in externalControl) {
          return (externalControl as any).trigger(name);
        }
        return Promise.resolve(true);
      },
      reset: (values?: any) => {
        if (externalControl && 'reset' in externalControl) {
          (externalControl as any).reset(values || defaultValues);
        }
      },
      setValue: (name: string, value: any) => {
        if (externalControl && 'setValue' in externalControl) {
          (externalControl as any).setValue(name, value);
        }
      },
      getValues: (name?: string) => {
        if (externalControl && 'getValues' in externalControl) {
          return (externalControl as any).getValues(name);
        }
        return name ? externalFormValues[name] : externalFormValues;
      },
      errors,
      clearFieldError,
      clearAllErrors,
      validateField: async (fieldPath: string) => {
        if (externalControl && 'trigger' in externalControl) {
          return await (externalControl as any).trigger(fieldPath);
        }
        return true;
      },
      validateForm: async () => {
        if (externalControl && 'trigger' in externalControl) {
          return await (externalControl as any).trigger();
        }
        return true;
      },
    };
  }

  // Enhanced uncontrolled mode: use internal form state
  return {
    control: internalForm.control,
    formState: internalForm.formState,
    handleSubmit: internalForm.handleSubmit,
    watch: internalForm.watch,
    trigger: internalForm.trigger,
    reset: (values?: any) => {
      internalForm.reset(values);
      clearAllErrors();
    },
    setValue: internalForm.setValue,
    getValues: internalForm.getValues,
    errors,
    clearFieldError,
    clearAllErrors,
    validateField: async (fieldPath: string) => {
      return internalForm.trigger(fieldPath);
    },
    validateForm: async () => {
      return internalForm.trigger();
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
