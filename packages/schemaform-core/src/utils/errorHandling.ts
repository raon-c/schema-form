import type { FieldError } from 'react-hook-form';
import type { z } from 'zod/v4';
import type {
  ErrorMessages,
  FieldErrorState,
  FieldMetadata,
  FormError,
  FormErrorState,
} from '../types';

/**
 * Convert Zod error to form-friendly error format
 */
export function convertZodErrorToFormError(zodError: z.ZodError): FormError[] {
  return zodError.issues.map(issue => ({
    message: issue.message,
    type: issue.code,
    path: issue.path.join('.'),
    code: issue.code,
  }));
}

/**
 * Create field error state from react-hook-form error
 */
export function createFieldErrorState(
  error?: FieldError,
  isDirty = false,
  isTouched = false
): FieldErrorState {
  return {
    hasError: !!error,
    error: error || undefined,
    isDirty,
    isTouched,
  };
}

/**
 * Check if field should show error based on display options
 */
export function shouldShowFieldError(
  errorState: FieldErrorState,
  meta: FieldMetadata,
  showErrorsOnTouch = true,
  showErrorsOnSubmit = false,
  isSubmitted = false
): boolean {
  if (!errorState.hasError) return false;

  // Check field-specific settings first
  if (meta.showErrorOnTouch !== undefined) {
    return meta.showErrorOnTouch ? errorState.isTouched : true;
  }

  // Use global settings
  if (showErrorsOnSubmit && isSubmitted) return true;
  if (showErrorsOnTouch && errorState.isTouched) return true;

  return false;
}

/**
 * Get custom error message for field
 */
export function getFieldErrorMessage(
  error: FieldError,
  fieldName: string,
  meta: FieldMetadata,
  errorMessages?: ErrorMessages
): string {
  // Check field-specific error message
  if (meta.errorMessage) {
    return typeof meta.errorMessage === 'function'
      ? meta.errorMessage(error, fieldName)
      : meta.errorMessage;
  }

  // Check global error messages
  if (errorMessages) {
    const { type } = error;

    switch (type) {
      case 'required':
        return typeof errorMessages.required === 'function'
          ? errorMessages.required(fieldName)
          : (errorMessages.required ?? error.message);

      case 'invalid_type':
        return typeof errorMessages.invalid === 'function'
          ? errorMessages.invalid(fieldName, type)
          : (errorMessages.invalid ?? error.message);

      case 'too_small':
        return typeof errorMessages.tooShort === 'function'
          ? errorMessages.tooShort(fieldName, (error as any).minimum || 0)
          : (errorMessages.tooShort ?? error.message);

      case 'too_big':
        return typeof errorMessages.tooLong === 'function'
          ? errorMessages.tooLong(fieldName, (error as any).maximum || 0)
          : (errorMessages.tooLong ?? error.message);

      case 'invalid_string':
        if ((error as any).validation === 'email') {
          return typeof errorMessages.email === 'function'
            ? errorMessages.email(fieldName)
            : (errorMessages.email ?? error.message);
        }
        if ((error as any).validation === 'url') {
          return typeof errorMessages.url === 'function'
            ? errorMessages.url(fieldName)
            : (errorMessages.url ?? error.message);
        }
        return typeof errorMessages.pattern === 'function'
          ? errorMessages.pattern(fieldName)
          : (errorMessages.pattern ?? error.message);

      case 'invalid_enum_value':
      case 'invalid_literal':
      case 'custom':
        if (errorMessages.custom?.[type]) {
          const customMessage = errorMessages.custom[type];
          return typeof customMessage === 'function'
            ? customMessage((error as any).received, fieldName)
            : customMessage;
        }
        break;
    }
  }

  // Fallback to original error message
  return error.message;
}

/**
 * Debounce function for delayed error display
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Create error message formatter with default messages
 */
export function createErrorMessageFormatter(errorMessages?: ErrorMessages) {
  return (error: FieldError, fieldName: string, meta: FieldMetadata) => {
    return getFieldErrorMessage(error, fieldName, meta, errorMessages);
  };
}

/**
 * Validate field path exists in form errors
 */
export function hasFieldError(
  errors: FormErrorState,
  fieldPath: string
): boolean {
  return errors[fieldPath]?.hasError || false;
}

/**
 * Get all field paths with errors
 */
export function getErrorFieldPaths(errors: FormErrorState): string[] {
  return Object.keys(errors).filter(path => errors[path].hasError);
}

/**
 * Clear specific field error
 */
export function clearFieldError(
  errors: FormErrorState,
  fieldPath: string
): FormErrorState {
  const newErrors = { ...errors };
  if (newErrors[fieldPath]) {
    newErrors[fieldPath] = {
      ...newErrors[fieldPath],
      hasError: false,
      error: undefined,
    };
  }
  return newErrors;
}

/**
 * Clear all errors
 */
export function clearAllErrors(errors: FormErrorState): FormErrorState {
  const clearedErrors: FormErrorState = {};
  for (const path in errors) {
    clearedErrors[path] = {
      ...errors[path],
      hasError: false,
      error: undefined,
    };
  }
  return clearedErrors;
}

/**
 * Default error messages in Korean
 */
export const defaultErrorMessages: ErrorMessages = {
  required: (fieldName: string) => `${fieldName}은(는) 필수 항목입니다.`,
  invalid: (fieldName: string, _type: string) =>
    `${fieldName}의 형식이 올바르지 않습니다.`,
  tooShort: (fieldName: string, min: number) =>
    `${fieldName}은(는) 최소 ${min}자 이상이어야 합니다.`,
  tooLong: (fieldName: string, max: number) =>
    `${fieldName}은(는) 최대 ${max}자 이하여야 합니다.`,
  email: (_fieldName: string) => `올바른 이메일 주소를 입력해주세요.`,
  url: (_fieldName: string) => `올바른 URL을 입력해주세요.`,
  number: (fieldName: string) => `${fieldName}은(는) 숫자여야 합니다.`,
  pattern: (fieldName: string) => `${fieldName}의 형식이 올바르지 않습니다.`,
};
