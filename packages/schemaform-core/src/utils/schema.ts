import {
  defaultErrorMap,
  ZodBoolean,
  ZodDate,
  ZodEnum,
  type ZodErrorMap,
  ZodIssueCode,
  ZodNativeEnum,
  ZodNumber,
  ZodObject,
  ZodString,
  type ZodTypeAny,
} from 'zod';

interface Field {
  path: string;
  zodType: ZodTypeAny;
  meta: {
    [key: string]: any;
  };
}

export const extractFieldsFromSchema = (
  schema: ZodTypeAny,
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
            meta: fieldSchema._def.metadata || {},
          });
        }
      }
    }
    return fields;
  }
  return [];
};

export const getComponentTypeFromZodType = (
  zodType: ZodTypeAny,
  meta: any
): string => {
  if (meta?.component) {
    return meta.component;
  }

  if (zodType instanceof ZodString) {
    // Zod doesn't have a built-in `isPassword`, so this would rely on custom metadata
    if (meta?.format === 'password') return 'password';
    if (zodType.isEmail) return 'email';
    return 'text';
  }
  if (zodType instanceof ZodNumber) {
    return 'number';
  }
  if (zodType instanceof ZodBoolean) {
    return 'checkbox';
  }
  if (zodType instanceof ZodEnum || zodType instanceof ZodNativeEnum) {
    return 'select';
  }
  if (zodType instanceof ZodDate) {
    return 'date';
  }

  return 'text';
};

export const createErrorMap =
  (errorMap: Record<string, string>): ZodErrorMap =>
  (issue, ctx) => {
    const path = issue.path.join('.');
    if (
      issue.code !== ZodIssueCode.invalid_union_discriminator &&
      errorMap[path]
    ) {
      return { message: errorMap[path] };
    }
    // Fallback to default error map for all other issues
    return defaultErrorMap(issue, ctx);
  };
