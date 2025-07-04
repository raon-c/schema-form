import { ZodObject } from 'zod/v4';
import type { $ZodErrorMap, $ZodType } from 'zod/v4/core';

interface Field {
  path: string;
  zodType: $ZodType;
  meta: {
    [key: string]: any;
  };
}

function parseMeta(description?: string) {
  if (!description) return {};
  try {
    return JSON.parse(description);
  } catch (e) {
    return { label: description };
  }
}

export const extractFieldsFromSchema = (
  schema: $ZodType,
  pathPrefix = ''
): Field[] => {
  if (schema instanceof ZodObject) {
    const shape = schema.shape;
    let fields: Field[] = [];
    for (const key in shape) {
      if (Object.hasOwn(shape, key)) {
        const newPath = pathPrefix ? `${pathPrefix}.${key}` : key;
        const fieldSchema = shape[key];

        if (fieldSchema instanceof ZodObject) {
          fields = fields.concat(extractFieldsFromSchema(fieldSchema, newPath));
        } else {
          fields.push({
            path: newPath,
            zodType: fieldSchema,
            meta: parseMeta(fieldSchema.description),
          });
        }
      }
    }
    return fields;
  }
  return [];
};

export const getComponentTypeFromZodType = (
  zodType: $ZodType,
  meta: any
): string => {
  if (meta?.component) {
    return meta.component;
  }

  // Use _zod.def.typeName for Zod v4 type checking
  const typeName =
    (zodType as any)._zod?.def?.typeName || (zodType as any)._def?.typeName;

  switch (typeName) {
    case 'ZodString':
      if (meta?.format === 'password') return 'password';
      // In Zod v4, check for email format differently
      if (
        (zodType as any)._zod?.def?.checks?.some(
          (check: any) => check.kind === 'email'
        )
      ) {
        return 'email';
      }
      return 'text';
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'checkbox';
    case 'ZodEnum':
    case 'ZodNativeEnum':
      return 'select';
    case 'ZodDate':
      return 'date';
    default:
      return 'text';
  }
};

export const createErrorMap =
  (errorMap: Record<string, string>): $ZodErrorMap =>
  issue => {
    const path = issue.path?.join('.') || '';
    if (errorMap[path]) {
      return { message: errorMap[path] };
    }
    // Return undefined to use default error message
    return undefined;
  };
