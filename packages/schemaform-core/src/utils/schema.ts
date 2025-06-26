import { z, ZodObject, ZodTypeAny, ZodEffects, ZodString, ZodEnum, ZodNativeEnum, ZodDate, ZodNumber, ZodBoolean } from 'zod';
import type { FieldMetadata } from '../types';

export interface ExtractedField {
  name: string;
  zodType: ZodTypeAny;
  metadata: FieldMetadata;
}

function doExtractFields(schema: ZodTypeAny, prefix = ''): ExtractedField[] {
  // ZodEffects와 같은 래퍼 타입 처리
  if (schema instanceof ZodEffects) {
    return doExtractFields(schema.innerType(), prefix);
  }

  if (schema instanceof ZodObject) {
    const shape = schema.shape;
    let fields: ExtractedField[] = [];

    for (const key in shape) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      const nestedFields = doExtractFields(shape[key], newPrefix);
      fields = fields.concat(nestedFields);
    }
    return fields;
  }

  // 기본 필드 타입 처리
  const metadata = schema._def.meta || {};
  return [{ name: prefix, zodType: schema, metadata }];
}


export function extractFieldsFromSchema(schema: ZodObject<any, any>): ExtractedField[] {
  return doExtractFields(schema);
}

export function getComponentType(zodType: ZodTypeAny, metadata: FieldMetadata): string {
  if (metadata.componentType) {
    return metadata.componentType;
  }

  // ZodEffects와 같은 래퍼 타입의 내부 타입을 확인
  if (zodType instanceof ZodEffects) {
    return getComponentType(zodType.innerType(), metadata);
  }

  // Zod 타입에 따른 추론
  if (zodType instanceof ZodEnum || zodType instanceof ZodNativeEnum) return 'select';
  if (zodType instanceof ZodNumber) return 'number';
  if (zodType instanceof ZodBoolean) return 'boolean';
  if (zodType instanceof ZodDate) return 'date';
  if (zodType instanceof ZodString) {
    if (zodType.isEmail) return 'email';
    // `password`는 meta로만 지정 가능
  }
  
  return 'string'; // 기본값
}
