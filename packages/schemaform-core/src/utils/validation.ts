import { ZodType, ZodError, ZodIssue } from 'zod';
import type { FieldErrors, FieldError } from 'react-hook-form';

// Define ValidationMode type if not available from react-hook-form
export type ValidationMode = 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';

// Type for custom error messages mapping
export type CustomErrorMessages = Record<string, string | ((error: ZodIssue) => string)>;

/**
 * Creates a Zod schema with custom error messages
 * @param schema - The original Zod schema
 * @param errorMessages - Custom error messages mapping
 * @returns Modified schema with custom error messages
 */
export function createSchemaWithCustomErrors<T extends ZodType<any>>(
  schema: T,
  errorMessages: CustomErrorMessages
): T {
  return schema.superRefine((data, ctx) => {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        const customMessage = errorMessages[path];
        
        if (customMessage) {
          const message = typeof customMessage === 'function' 
            ? customMessage(err) 
            : customMessage;
            
          ctx.addIssue({
            ...err,
            message,
          });
        } else {
          ctx.addIssue(err);
        }
      });
    }
  }) as unknown as T;
}

/**
 * Transforms Zod errors to react-hook-form field errors format
 * @param zodError - The Zod error object
 * @returns Field errors object compatible with react-hook-form
 */
export function transformZodErrorsToFieldErrors(zodError: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    if (path) {
      fieldErrors[path] = {
        type: error.code,
        message: error.message,
      } as FieldError;
    }
  });
  
  return fieldErrors;
}

/**
 * Gets validation mode configuration for react-hook-form
 * @param mode - The validation mode
 * @returns Configuration object for react-hook-form
 */
export function getValidationModeConfig(mode: ValidationMode = 'onChange') {
  const configs = {
    onBlur: {
      mode: 'onBlur' as const,
      reValidateMode: 'onChange' as const,
    },
    onChange: {
      mode: 'onChange' as const,
      reValidateMode: 'onChange' as const,
    },
    onSubmit: {
      mode: 'onSubmit' as const,
      reValidateMode: 'onChange' as const,
    },
    onTouched: {
      mode: 'onTouched' as const,
      reValidateMode: 'onChange' as const,
    },
    all: {
      mode: 'all' as const,
      reValidateMode: 'onChange' as const,
    },
  } as const;
  
  return configs[mode];
}

/**
 * Creates an async validator function for Zod schemas
 * @param asyncValidators - Map of field paths to async validation functions
 * @returns A function that can be used with Zod's refine method
 */
export function createAsyncValidator(
  asyncValidators: Record<string, (value: any) => Promise<boolean | string>>
) {
  return async (data: any) => {
    const errors: Array<{ path: string[]; message: string }> = [];
    
    for (const [path, validator] of Object.entries(asyncValidators)) {
      const pathParts = path.split('.');
      let value = data;
      
      // Navigate to the nested value
      for (const part of pathParts) {
        value = value?.[part];
      }
      
      if (value !== undefined) {
        try {
          const result = await validator(value);
          if (typeof result === 'string') {
            errors.push({ path: pathParts, message: result });
          } else if (!result) {
            errors.push({ path: pathParts, message: `Validation failed for ${path}` });
          }
        } catch (error) {
          errors.push({ 
            path: pathParts, 
            message: error instanceof Error ? error.message : 'Validation error' 
          });
        }
      }
    }
    
    return errors;
  };
} 