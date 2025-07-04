import { ZodObject, z } from 'zod/v4';
import type { $ZodErrorMap, $ZodType } from 'zod/v4/core';

interface Field {
  path: string;
  zodType: $ZodType;
  meta: {
    [key: string]: any;
  };
}

function extractMeta(schema: $ZodType): any {
  try {
    // Zod v4의 올바른 방식: .meta()를 인수 없이 호출하여 메타데이터 가져오기
    const meta = (schema as any).meta?.();
    if (meta && Object.keys(meta).length > 0) {
      return meta;
    }
  } catch (e) {
    // .meta() 메서드가 없거나 호출 실패 시 계속 진행
  }

  // 대안: globalRegistry에서 직접 가져오기
  try {
    const registryMeta = z.globalRegistry.get(schema);
    if (registryMeta && Object.keys(registryMeta).length > 0) {
      return registryMeta;
    }
  } catch (e) {
    // Registry 접근 실패 시 계속 진행
  }

  // Fallback: description을 JSON으로 파싱하기 (legacy)
  const description = (schema as any).description;
  if (description) {
    try {
      return JSON.parse(description);
    } catch (e) {
      return { label: description };
    }
  }

  return {};
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
            meta: extractMeta(fieldSchema),
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
  if (meta?.componentType) {
    return meta.componentType;
  }

  // Use _zod.def.typeName for Zod v4 type checking
  const typeName =
    (zodType as any)._zod?.def?.typeName || (zodType as any)._def?.typeName;

  switch (typeName) {
    case 'ZodString':
      if (meta?.componentType === 'password') return 'password';
      if (meta?.componentType === 'textarea') return 'textarea';
      // In Zod v4, check for email format differently
      if (
        (zodType as any)._zod?.def?.checks?.some(
          (check: any) => check.kind === 'email'
        ) ||
        (zodType as any)._def?.checks?.some(
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
