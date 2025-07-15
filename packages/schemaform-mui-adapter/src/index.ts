/**
 * @schemaform/mui-adapter
 * 
 * Material-UI adapter for SchemaForm library
 * Provides Material-UI components for form field rendering
 */

export { MUIAdapter } from './MUIAdapter';

// Re-export types from core for convenience
export type {
  UIAdapter,
  FieldProps,
  FormContainerProps,
  RenderFieldLayout,
  RenderFieldLayoutProps,
  StandardComponentType,
  FieldMetadata,
} from '@schemaform/core';