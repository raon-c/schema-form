import { useCallback, useMemo, useState } from 'react';
import type { FieldError } from 'react-hook-form';
import type {
  ErrorDisplayOptions,
  ErrorMessages,
  FormErrorState,
} from '../types';
import {
  clearAllErrors as clearAllErrorsUtil,
  clearFieldError as clearFieldErrorUtil,
  createFieldErrorState,
  defaultErrorMessages,
  getErrorFieldPaths,
  getFieldErrorMessage,
  hasFieldError,
  shouldShowFieldError,
} from '../utils/errorHandling';

export interface UseErrorHandlingProps {
  errorMessages?: ErrorMessages;
  errorDisplayOptions?: ErrorDisplayOptions;
  onError?: (errors: FormErrorState) => void;
}

export interface UseErrorHandlingReturn {
  errors: FormErrorState;
  setFieldError: (
    fieldPath: string,
    error: FieldError | undefined,
    isDirty?: boolean,
    isTouched?: boolean
  ) => void;
  clearFieldError: (fieldPath: string) => void;
  clearAllErrors: () => void;
  hasFieldError: (fieldPath: string) => boolean;
  getErrorFieldPaths: () => string[];
  shouldShowError: (
    fieldPath: string,
    meta: any,
    isSubmitted?: boolean
  ) => boolean;
  formatErrorMessage: (
    error: FieldError,
    fieldName: string,
    meta: any
  ) => string;
  errorCount: number;
}

export function useErrorHandling({
  errorMessages = defaultErrorMessages,
  errorDisplayOptions = {},
  onError,
}: UseErrorHandlingProps = {}): UseErrorHandlingReturn {
  const [errors, setErrors] = useState<FormErrorState>({});

  const {
    showErrorsOnTouch = true,
    showErrorsOnSubmit = false,
    showErrorsOnBlur = false,
    showErrorsOnChange = false,
    clearErrorsOnFocus = false,
  } = errorDisplayOptions;

  // Error message formatter
  const formatErrorMessage = useCallback(
    (error: FieldError, fieldName: string, meta: any) => {
      return getFieldErrorMessage(error, fieldName, meta, errorMessages);
    },
    [errorMessages]
  );

  // Set field error
  const setFieldError = useCallback(
    (
      fieldPath: string,
      error: FieldError | undefined,
      isDirty = false,
      isTouched = false
    ) => {
      setErrors(prevErrors => {
        const errorState = createFieldErrorState(error, isDirty, isTouched);
        const newErrors = {
          ...prevErrors,
          [fieldPath]: errorState,
        };

        // Call onError callback if provided
        onError?.(newErrors);

        return newErrors;
      });
    },
    [onError]
  );

  // Clear field error
  const clearFieldError = useCallback(
    (fieldPath: string) => {
      setErrors(prevErrors => {
        const newErrors = clearFieldErrorUtil(prevErrors, fieldPath);
        onError?.(newErrors);
        return newErrors;
      });
    },
    [onError]
  );

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors(prevErrors => {
      const newErrors = clearAllErrorsUtil(prevErrors);
      onError?.(newErrors);
      return newErrors;
    });
  }, [onError]);

  // Check if field has error
  const checkHasFieldError = useCallback(
    (fieldPath: string) => {
      return hasFieldError(errors, fieldPath);
    },
    [errors]
  );

  // Get all error field paths
  const getErrorFieldPathsList = useCallback(() => {
    return getErrorFieldPaths(errors);
  }, [errors]);

  // Check if error should be shown
  const shouldShowError = useCallback(
    (fieldPath: string, meta: any, isSubmitted = false) => {
      const errorState = errors[fieldPath];
      if (!errorState) return false;

      return shouldShowFieldError(
        errorState,
        meta,
        showErrorsOnTouch,
        showErrorsOnSubmit,
        isSubmitted
      );
    },
    [errors, showErrorsOnTouch, showErrorsOnSubmit]
  );

  // Count total errors
  const errorCount = useMemo(() => {
    return Object.values(errors).filter(error => error.hasError).length;
  }, [errors]);

  return {
    errors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    hasFieldError: checkHasFieldError,
    getErrorFieldPaths: getErrorFieldPathsList,
    shouldShowError,
    formatErrorMessage,
    errorCount,
  };
}
