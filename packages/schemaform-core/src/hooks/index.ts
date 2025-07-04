// React hooks for form functionality
// This module contains custom hooks used by the SchemaForm library

// Re-export the main hook from core
export { createSchemaResolver, isControlledMode, useSchemaForm } from '../core';
export type {
  UseErrorHandlingProps,
  UseErrorHandlingReturn,
} from './useErrorHandling';
// Export error handling hook
export { useErrorHandling } from './useErrorHandling';

// TODO: Implement additional hooks for advanced functionality
// export * from './useConditionalFields';
// export * from './useFieldMetadata';
