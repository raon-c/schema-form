import {
  ZodArray,
  ZodDefault,
  ZodNullable,
  ZodObject,
  ZodOptional,
  z,
} from 'zod/v4';
import type { $ZodType } from 'zod/v4/core';
import type { FieldMetadata, FormField, StandardComponentType } from '../types';

/**
 * Enhanced metadata extraction from Zod schema with proper Zod v4 support
 */
function extractMetadata(schema: $ZodType): FieldMetadata {
  let extractedMeta: any = {};

  try {
    // Primary method: Try to get metadata from .meta() method
    if (typeof (schema as any).meta === 'function') {
      const meta = (schema as any).meta();
      if (meta && typeof meta === 'object' && Object.keys(meta).length > 0) {
        extractedMeta = { ...meta };
      }
    }
  } catch (e) {
    // Continue if meta() method fails
  }

  try {
    // Alternative: Check for metadata in _def
    const def = (schema as any)._def;
    if (def?.meta && typeof def.meta === 'object') {
      extractedMeta = { ...extractedMeta, ...def.meta };
    }
  } catch (e) {
    // Continue if _def access fails
  }

  try {
    // Fallback: Try global registry (if available)
    const registryMeta = z.globalRegistry?.get?.(schema);
    if (
      registryMeta &&
      typeof registryMeta === 'object' &&
      Object.keys(registryMeta).length > 0
    ) {
      extractedMeta = { ...extractedMeta, ...registryMeta };
    }
  } catch (e) {
    // Continue if registry access fails
  }

  // Legacy fallback: Parse description as JSON or use as label
  const description = (schema as any).description;
  if (description && typeof description === 'string') {
    try {
      const parsedDescription = JSON.parse(description);
      if (typeof parsedDescription === 'object') {
        extractedMeta = { ...extractedMeta, ...parsedDescription };
      }
    } catch (e) {
      // If not JSON, use as label
      if (!extractedMeta.label) {
        extractedMeta.label = description;
      }
    }
  }

  // Ensure we have at least a label
  if (!extractedMeta.label && typeof extractedMeta.label !== 'string') {
    extractedMeta.label = '';
  }

  return extractedMeta as FieldMetadata;
}

/**
 * Check if a Zod type is optional
 */
function isOptionalField(zodType: $ZodType): boolean {
  // Check for ZodOptional wrapper
  if (zodType instanceof ZodOptional) {
    return true;
  }

  // Check for ZodNullable (which can be considered optional)
  if (zodType instanceof ZodNullable) {
    return true;
  }

  // Check _def for optional flag
  const def = (zodType as any)._def;
  if (def && def.typeName === 'ZodOptional') {
    return true;
  }

  return false;
}

/**
 * Extract default value from Zod schema
 */
function extractDefaultValue(zodType: $ZodType): any {
  // Check for ZodDefault wrapper
  if (zodType instanceof ZodDefault) {
    try {
      return (zodType._def.defaultValue as () => any)();
    } catch (e) {
      return undefined;
    }
  }

  // Check _def for default value
  const def = (zodType as any)._def;
  if (
    def &&
    def.typeName === 'ZodDefault' &&
    typeof def.defaultValue === 'function'
  ) {
    try {
      return def.defaultValue();
    } catch (e) {
      return undefined;
    }
  }

  return undefined;
}

/**
 * Unwrap nested Zod types (Optional, Nullable, Default) to get the inner type
 */
function unwrapZodType(zodType: $ZodType): $ZodType {
  let currentType = zodType;

  // Keep unwrapping until we get to the core type
  while (true) {
    if (currentType instanceof ZodOptional) {
      currentType = currentType._def.innerType;
    } else if (currentType instanceof ZodNullable) {
      currentType = currentType._def.innerType;
    } else if (currentType instanceof ZodDefault) {
      currentType = currentType._def.innerType;
    } else {
      break;
    }
  }

  return currentType;
}

/**
 * Enhanced field extraction with support for nested objects, arrays, and proper metadata
 */
export function extractFieldsFromSchema(
  schema: $ZodType,
  pathPrefix = ''
): FormField[] {
  const fields: FormField[] = [];

  // Unwrap the schema to get the core type
  const unwrappedSchema = unwrapZodType(schema);

  if (unwrappedSchema instanceof ZodObject) {
    const shape = unwrappedSchema.shape;

    for (const key in shape) {
      if (Object.hasOwn(shape, key)) {
        const fieldSchema = shape[key];
        const fieldPath = pathPrefix ? `${pathPrefix}.${key}` : key;

        // Extract field information
        const isOptional = isOptionalField(fieldSchema);
        const defaultValue = extractDefaultValue(fieldSchema);
        const metadata = extractMetadata(fieldSchema);

        // Unwrap the field schema to check its core type
        const unwrappedFieldSchema = unwrapZodType(fieldSchema);

        // Handle nested objects recursively
        if (unwrappedFieldSchema instanceof ZodObject) {
          const nestedFields = extractFieldsFromSchema(fieldSchema, fieldPath);
          fields.push(...nestedFields);
        }
        // Handle arrays
        else if (unwrappedFieldSchema instanceof ZodArray) {
          // For now, treat arrays as simple fields
          // TODO: Implement nested array field extraction
          fields.push({
            path: fieldPath,
            zodType: fieldSchema,
            meta: {
              ...metadata,
              isArray: true,
            },
            isOptional,
            defaultValue,
          });
        }
        // Regular field
        else {
          fields.push({
            path: fieldPath,
            zodType: fieldSchema,
            meta: metadata,
            isOptional,
            defaultValue,
          });
        }
      }
    }
  }

  return fields;
}

/**
 * Enhanced component type resolution with support for all standard types
 */
export function getComponentTypeFromZodType(
  zodType: $ZodType,
  meta?: FieldMetadata
): StandardComponentType | string {
  // Priority 1: Check meta for explicit component type override
  if (meta?.componentType) {
    return meta.componentType;
  }

  // Priority 2: Check if custom component is specified
  if (meta?.component) {
    // Return a special identifier for custom components
    return 'custom';
  }

  // Priority 3: Analyze the Zod type to determine appropriate component
  const unwrappedType = unwrapZodType(zodType);
  const typeName = (unwrappedType as any)._def?.typeName;

  switch (typeName) {
    case 'ZodString': {
      return resolveStringComponentType(unwrappedType, meta);
    }

    case 'ZodNumber':
    case 'ZodBigInt': {
      return resolveNumberComponentType(unwrappedType, meta);
    }

    case 'ZodBoolean': {
      return resolveBooleanComponentType(unwrappedType, meta);
    }

    case 'ZodEnum':
    case 'ZodNativeEnum': {
      return resolveEnumComponentType(unwrappedType, meta);
    }

    case 'ZodDate': {
      return resolveDateComponentType(unwrappedType, meta);
    }

    case 'ZodArray': {
      return resolveArrayComponentType(unwrappedType, meta);
    }

    case 'ZodUnion':
    case 'ZodDiscriminatedUnion': {
      return resolveUnionComponentType(unwrappedType, meta);
    }

    case 'ZodObject': {
      return resolveObjectComponentType(unwrappedType, meta);
    }

    case 'ZodLiteral': {
      return resolveLiteralComponentType(unwrappedType, meta);
    }

    default: {
      return resolveUnknownComponentType(unwrappedType, meta, typeName);
    }
  }
}

/**
 * Resolve component type for ZodString with enhanced validation detection
 */
function resolveStringComponentType(
  zodType: $ZodType,
  _meta?: FieldMetadata
): StandardComponentType {
  const def = (zodType as any)._def;

  // Check for specific string validations
  if (def.checks && Array.isArray(def.checks)) {
    for (const check of def.checks) {
      switch (check.kind) {
        case 'email':
          return 'email';
        case 'url':
          return 'url';
        case 'regex': {
          // Enhanced regex pattern detection
          const pattern = check.regex?.toString() || '';

          // Phone number patterns
          if (
            pattern.includes('tel') ||
            pattern.includes('phone') ||
            pattern.includes('\\d{3}') ||
            pattern.includes('[0-9]')
          ) {
            return 'tel';
          }

          // Search patterns
          if (pattern.includes('search') || pattern.includes('query')) {
            return 'search';
          }

          break;
        }
        case 'min': {
          // Long strings might be better as textarea
          if (check.value && check.value > 100) {
            return 'textarea';
          }
          break;
        }
      }
    }
  }

  // Check string length constraints for textarea detection
  const minLength = def.checks?.find((c: any) => c.kind === 'min')?.value;
  const maxLength = def.checks?.find((c: any) => c.kind === 'max')?.value;

  if ((minLength && minLength > 50) || (maxLength && maxLength > 200)) {
    return 'textarea';
  }

  // Default to text input
  return 'text';
}

/**
 * Resolve component type for ZodNumber with range considerations
 */
function resolveNumberComponentType(
  zodType: $ZodType,
  _meta?: FieldMetadata
): StandardComponentType {
  const def = (zodType as any)._def;

  // Check for specific number constraints that might suggest different input types
  if (def.checks && Array.isArray(def.checks)) {
    const minCheck = def.checks.find((c: any) => c.kind === 'min');
    const maxCheck = def.checks.find((c: any) => c.kind === 'max');

    // Could add logic for range inputs, sliders, etc. based on constraints
    // For now, return standard number input
  }

  return 'number';
}

/**
 * Resolve component type for ZodBoolean with context awareness
 */
function resolveBooleanComponentType(
  _zodType: $ZodType,
  meta?: FieldMetadata
): StandardComponentType {
  // Check meta for hints about the boolean's purpose
  const label = meta?.label?.toLowerCase() || '';

  // Switch-like contexts
  if (
    label.includes('enable') ||
    label.includes('toggle') ||
    label.includes('active') ||
    label.includes('on/off')
  ) {
    return 'switch';
  }

  // Default to checkbox for most boolean fields
  return 'checkbox';
}

/**
 * Resolve component type for ZodEnum with intelligent selection
 */
function resolveEnumComponentType(
  zodType: $ZodType,
  _meta?: FieldMetadata
): StandardComponentType {
  const def = (zodType as any)._def;
  const enumValues = def.values;

  if (Array.isArray(enumValues)) {
    // Radio buttons for small sets of options
    if (enumValues.length <= 4) {
      return 'radio';
    }

    // Select for larger sets
    if (enumValues.length <= 20) {
      return 'select';
    }

    // For very large sets, might want autocomplete or search
    return 'select'; // Could be enhanced with search functionality
  }

  if (typeof enumValues === 'object') {
    const keys = Object.keys(enumValues);
    return keys.length <= 4 ? 'radio' : 'select';
  }

  return 'select';
}

/**
 * Resolve component type for ZodDate with format considerations
 */
function resolveDateComponentType(
  _zodType: $ZodType,
  _metaa?: FieldMetadata
): StandardComponentType {
  // Could be enhanced to support different date formats
  // datetime-local, time, month, week, etc.
  return 'date';
}

/**
 * Resolve component type for ZodArray with element type awareness
 */
function resolveArrayComponentType(
  zodType: $ZodType,
  _meta?: FieldMetadata
): StandardComponentType {
  const def = (zodType as any)._def;
  const elementType = def.type;

  if (elementType) {
    const elementTypeName = (elementType as any)._def?.typeName;

    // Multi-select for enum arrays
    if (elementTypeName === 'ZodEnum' || elementTypeName === 'ZodNativeEnum') {
      return 'select'; // Multi-select variant
    }

    // String arrays might be tag inputs
    if (elementTypeName === 'ZodString') {
      return 'text'; // Could be enhanced with tag input
    }
  }

  return 'select';
}

/**
 * Resolve component type for ZodUnion with option analysis
 */
function resolveUnionComponentType(
  zodType: $ZodType,
  _meta?: FieldMetadata
): StandardComponentType {
  const def = (zodType as any)._def;
  const options = def.options;

  if (Array.isArray(options)) {
    // Check if all options are literals (good for select/radio)
    const allLiterals = options.every(
      (opt: any) => opt._def?.typeName === 'ZodLiteral'
    );

    if (allLiterals) {
      return options.length <= 4 ? 'radio' : 'select';
    }
  }

  return 'select';
}

/**
 * Resolve component type for ZodObject (nested objects)
 */
function resolveObjectComponentType(
  _zodType: $ZodType,
  _metaa?: FieldMetadata
): string {
  // Objects typically need custom handling
  return 'object';
}

/**
 * Resolve component type for ZodLiteral
 */
function resolveLiteralComponentType(
  _zodType: $ZodType,
  _metaa?: FieldMetadata
): StandardComponentType {
  // Literals are typically used in unions for select options
  return 'text';
}

/**
 * Fallback resolution for unknown types with enhanced logic
 */
function resolveUnknownComponentType(
  zodType: $ZodType,
  meta?: FieldMetadata,
  typeName?: string
): StandardComponentType | string {
  // Log unknown types for debugging (in development)
  if (typeof window !== 'undefined' && (window as any).__DEV__) {
    console.warn(`Unknown Zod type encountered: ${typeName}`, zodType);
  }

  // Try to infer from meta information
  if (meta?.label) {
    const label = meta.label.toLowerCase();

    // Common field name patterns
    if (label.includes('email')) return 'email';
    if (label.includes('password')) return 'password';
    if (label.includes('phone') || label.includes('tel')) return 'tel';
    if (label.includes('url') || label.includes('website')) return 'url';
    if (label.includes('search')) return 'search';
    if (label.includes('date') || label.includes('time')) return 'date';
    if (
      label.includes('number') ||
      label.includes('count') ||
      label.includes('amount')
    )
      return 'number';
    if (
      label.includes('description') ||
      label.includes('comment') ||
      label.includes('note')
    )
      return 'textarea';
  }

  // Safe fallback to text input
  return 'text';
}

/**
 * Extract options for select/radio components from enum schemas
 */
export function extractOptionsFromSchema(
  zodType: $ZodType
): Array<{ value: string; label: string }> | undefined {
  const unwrappedType = unwrapZodType(zodType);
  const typeName = (unwrappedType as any)._def?.typeName;

  if (typeName === 'ZodEnum' || typeName === 'ZodNativeEnum') {
    const values = (unwrappedType as any)._def.values;

    if (Array.isArray(values)) {
      return values.map(value => ({
        value: String(value),
        label: String(value), // Could be enhanced with custom labels from meta
      }));
    }

    if (typeof values === 'object') {
      return Object.entries(values).map(([key, value]) => ({
        value: String(value),
        label: key,
      }));
    }
  }

  if (typeName === 'ZodUnion') {
    const options = (unwrappedType as any)._def.options;
    if (Array.isArray(options)) {
      return options
        .filter((option: any) => option._def?.typeName === 'ZodLiteral')
        .map((option: any) => ({
          value: String(option._def.value),
          label: String(option._def.value),
        }));
    }
  }

  return undefined;
}

/**
 * Create enhanced error map with field-specific messages
 */
export function createErrorMap(errorMap: Record<string, string>) {
  return (issue: any) => {
    const path = issue.path?.join('.') || '';

    // Check for field-specific error message
    if (errorMap[path]) {
      return { message: errorMap[path] };
    }

    // Check for type-specific error messages
    const typeKey = `${path}.${issue.code}`;
    if (errorMap[typeKey]) {
      return { message: errorMap[typeKey] };
    }

    // Return undefined to use default error message
    return undefined;
  };
}

/**
 * Validate if a schema field supports the given component type
 */
export function isValidComponentType(
  zodType: $ZodType,
  componentType: string
): boolean {
  const defaultType = getComponentTypeFromZodType(zodType);

  // Allow exact matches
  if (defaultType === componentType) {
    return true;
  }

  const unwrappedType = unwrapZodType(zodType);
  const typeName = (unwrappedType as any)._def?.typeName;

  // Allow compatible component types
  switch (typeName) {
    case 'ZodString':
      return [
        'text',
        'password',
        'textarea',
        'email',
        'url',
        'tel',
        'search',
      ].includes(componentType);
    case 'ZodNumber':
      return ['number', 'text'].includes(componentType);
    case 'ZodBoolean':
      return ['checkbox', 'switch'].includes(componentType);
    case 'ZodEnum':
    case 'ZodNativeEnum':
      return ['select', 'radio'].includes(componentType);
    default:
      return false;
  }
}

/**
 * Get suggested component types for a given Zod type
 */
export function getSuggestedComponentTypes(
  zodType: $ZodType
): StandardComponentType[] {
  const unwrappedType = unwrapZodType(zodType);
  const typeName = (unwrappedType as any)._def?.typeName;

  switch (typeName) {
    case 'ZodString':
      return ['text', 'password', 'textarea', 'email', 'url', 'tel', 'search'];
    case 'ZodNumber':
    case 'ZodBigInt':
      return ['number'];
    case 'ZodBoolean':
      return ['checkbox', 'switch'];
    case 'ZodEnum':
    case 'ZodNativeEnum':
      return ['select', 'radio'];
    case 'ZodDate':
      return ['date'];
    case 'ZodArray':
      return ['select']; // Multi-select could be added
    default:
      return ['text']; // Safe fallback
  }
}

/**
 * Enhanced component type resolver with fallback chain
 */
export function resolveComponentTypeWithFallback(
  zodType: $ZodType,
  meta?: FieldMetadata,
  preferredType?: string
): StandardComponentType | string {
  // Try preferred type first if provided
  if (preferredType && isValidComponentType(zodType, preferredType)) {
    return preferredType as StandardComponentType;
  }

  // Use the main resolution logic
  const resolvedType = getComponentTypeFromZodType(zodType, meta);

  // Validate the resolved type is supported
  if (isValidComponentType(zodType, resolvedType)) {
    return resolvedType;
  }

  // Fallback to suggested types
  const suggestedTypes = getSuggestedComponentTypes(zodType);
  return suggestedTypes[0] || 'text';
}

/**
 * Component type compatibility matrix for validation
 */
export const COMPONENT_TYPE_COMPATIBILITY = {
  ZodString: ['text', 'password', 'textarea', 'email', 'url', 'tel', 'search'],
  ZodNumber: ['number', 'text'],
  ZodBigInt: ['number', 'text'],
  ZodBoolean: ['checkbox', 'switch'],
  ZodEnum: ['select', 'radio'],
  ZodNativeEnum: ['select', 'radio'],
  ZodDate: ['date'],
  ZodArray: ['select'],
  ZodUnion: ['select', 'radio'],
  ZodDiscriminatedUnion: ['select', 'radio'],
  ZodObject: ['object'],
  ZodLiteral: ['text'],
} as const;

/**
 * Get all compatible component types for a Zod type
 */
export function getCompatibleComponentTypes(zodType: $ZodType): string[] {
  const unwrappedType = unwrapZodType(zodType);
  const typeName = (unwrappedType as any)._def?.typeName;

  const compatibleTypes =
    COMPONENT_TYPE_COMPATIBILITY[
      typeName as keyof typeof COMPONENT_TYPE_COMPATIBILITY
    ];

  return compatibleTypes ? [...compatibleTypes] : ['text'];
}
