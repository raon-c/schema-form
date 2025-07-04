import {
  defaultErrorMap,
  type ZodErrorMap,
  ZodIssueCode,
  ZodObject,
  type ZodString,
  type ZodTypeAny,
} from 'zod';

interface Field {
  path: string;
  zodType: ZodTypeAny;
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
  zodType: ZodTypeAny,
  meta: any
): string => {
  if (meta?.component) {
    return meta.component;
  }

  // Use _def.typeName for robust type checking in test environments
  switch (zodType._def.typeName) {
    case 'ZodString':
      if (meta?.format === 'password') return 'password';
      if ((zodType as ZodString).isEmail) return 'email';
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
