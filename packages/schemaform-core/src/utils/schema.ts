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
  // Check meta for explicit component type first
  if (meta?.componentType) {
    return meta.componentType;
  }

  // Unwrap the type to get the core type
  const unwrappedType = unwrapZodType(zodType);

  // Get the type name from Zod's internal structure
  const typeName = (unwrappedType as any)._def?.typeName;

  switch (typeName) {
    case 'ZodString': {
      const def = (unwrappedType as any)._def;

      // Check for specific string validations
      if (def.checks) {
        for (const check of def.checks) {
          switch (check.kind) {
            case 'email':
              return 'email';
            case 'url':
              return 'url';
            case 'regex':
              // Could be phone, etc. based on pattern
              if (check.regex?.toString().includes('tel')) {
                return 'tel';
              }
              break;
          }
        }
      }

      // Check meta for specific string types
      if (meta?.componentType === 'password') return 'password';
      if (meta?.componentType === 'textarea') return 'textarea';
      if (meta?.componentType === 'search') return 'search';

      return 'text';
    }

    case 'ZodNumber':
    case 'ZodBigInt':
      return 'number';

    case 'ZodBoolean':
      // Check meta to determine if it should be a switch or checkbox
      return meta?.componentType === 'switch' ? 'switch' : 'checkbox';

    case 'ZodEnum':
    case 'ZodNativeEnum': {
      // Check if it should be radio buttons based on meta or number of options
      const enumValues = (unwrappedType as any)._def.values;
      if (
        meta?.componentType === 'radio' ||
        (Array.isArray(enumValues) && enumValues.length <= 4)
      ) {
        return 'radio';
      }
      return 'select';
    }

    case 'ZodDate':
      return 'date';

    case 'ZodArray':
      // For arrays, we typically want a multi-select or custom array component
      return meta?.componentType || 'select'; // Could be enhanced with multi-select

    case 'ZodUnion':
    case 'ZodDiscriminatedUnion':
      // For unions, typically use select
      return 'select';

    default:
      // Fallback to text for unknown types
      return 'text';
  }
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
