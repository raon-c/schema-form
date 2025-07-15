import { useCallback, useMemo, useRef, useState } from 'react';
import type { FieldError } from 'react-hook-form';
import type {
  ErrorDisplayOptions,
  ErrorMessages,
  FieldMetadata,
  FormErrorState,
  ValidationResult,
} from '../types';
import { ErrorManager } from '../utils/ErrorManager';
import { useAsyncValidation } from './useAsyncValidation';

export interface UseErrorHandlingProps {
  errorMessages?: ErrorMessages | undefined;
  errorDisplayOptions?: ErrorDisplayOptions | undefined;
  onError?: ((errors: FormErrorState) => void) | undefined;
}

export interface UseErrorHandlingReturn {
  errors: FormErrorState;
  setFieldError: (
    fieldPath: string,
    error: FieldError | undefined,
    isDirty?: boolean,
    isTouched?: boolean,
    isValidating?: boolean,
    meta?: FieldMetadata
  ) => void;
  clearFieldError: (fieldPath: string) => void;
  clearAllErrors: () => void;
  hasFieldError: (fieldPath: string) => boolean;
  getErrorFieldPaths: () => string[];
  shouldShowError: (
    fieldPath: string,
    meta: FieldMetadata,
    isSubmitted?: boolean
  ) => boolean;
  formatErrorMessage: (
    error: FieldError,
    fieldName: string,
    meta: FieldMetadata
  ) => string;
  errorCount: number;
  // Enhanced methods from ErrorManager
  setFieldTouched: (fieldPath: string, isTouched?: boolean) => void;
  setFieldDirty: (fieldPath: string, isDirty?: boolean) => void;
  setFieldValidating: (fieldPath: string, isValidating?: boolean) => void;
  getFieldErrorState: (
    fieldPath: string
  ) => import('../types').FieldErrorState | undefined;
  isAnyFieldValidating: () => boolean;
  getValidatingFieldPaths: () => string[];
  getErrorSummary: () => {
    totalErrors: number;
    validatingFields: number;
    touchedFields: number;
    dirtyFields: number;
    errorsByType: Record<string, number>;
  };
  batchUpdateErrors: (
    updates: Array<{
      fieldPath: string;
      error?: FieldError;
      isDirty?: boolean;
      isTouched?: boolean;
      isValidating?: boolean;
    }>
  ) => void;
  // Accessibility methods
  announceFormErrors: (
    fieldsWithMeta: Array<{ fieldPath: string; meta: FieldMetadata }>
  ) => void;
  announceFormSuccess: (message?: string) => void;
  focusFirstErrorField: () => void;
  setFieldAccessibility: (
    fieldPath: string,
    meta: FieldMetadata,
    isRequired?: boolean
  ) => void;
  associateErrorWithField: (fieldPath: string, errorId: string) => void;
  generateErrorId: (fieldPath: string) => string;
  setupKeyboardNavigation: (formElement: HTMLElement) => void;
  // Async validation methods
  validateFieldAsync: (
    fieldPath: string,
    validationFn: () => Promise<boolean | FieldError | null>,
    options?: {
      debounceMs?: number;
      cacheKey?: string;
      abortPrevious?: boolean;
    }
  ) => Promise<ValidationResult>;
  isFieldValidatingAsync: (fieldPath: string) => boolean;
  cancelFieldValidation: (fieldPath: string) => Promise<void>;
  cancelAllValidations: () => Promise<void>;
  getAsyncValidationResult: (fieldPath: string) => ValidationResult | undefined;
}

export function useErrorHandling({
  errorMessages,
  errorDisplayOptions,
  onError,
}: UseErrorHandlingProps = {}): UseErrorHandlingReturn {
  // Force re-render when error state changes
  const [, setRenderKey] = useState(0);
  const forceRerender = useCallback(() => setRenderKey(prev => prev + 1), []);

  // Create ErrorManager instance with callback to trigger re-renders
  const errorManagerRef = useRef<ErrorManager | null>(null);

  if (!errorManagerRef.current) {
    errorManagerRef.current = new ErrorManager(
      errorDisplayOptions,
      errorMessages,
      errors => {
        onError?.(errors);
        forceRerender();
      }
    );
  }

  const errorManager = errorManagerRef.current;

  // Initialize async validation hook
  const {
    validateField: validateFieldAsync,
    isFieldValidating: isFieldValidatingAsync,
    cancelFieldValidation,
    cancelAllValidations,
    getValidationResult: getAsyncValidationResult,
  } = useAsyncValidation({
    onValidationStateChange: (state) => {
      // Update error manager with validation states
      for (const fieldPath of state.validatingFields) {
        errorManager.setFieldValidating(fieldPath, true);
      }
      
      // Clear validation state for fields no longer validating
      const currentValidatingFields = errorManager.getValidatingFieldPaths();
      for (const fieldPath of currentValidatingFields) {
        if (!state.validatingFields.has(fieldPath)) {
          errorManager.setFieldValidating(fieldPath, false);
        }
      }
    },
  });

  // Update ErrorManager when props change
  useMemo(() => {
    if (errorDisplayOptions) {
      errorManager.updateDisplayOptions(errorDisplayOptions);
    }
    if (errorMessages) {
      errorManager.updateErrorMessages(errorMessages);
    }
  }, [errorManager, errorDisplayOptions, errorMessages]);

  // Get current error state
  const errors = useMemo(() => errorManager.getErrorState(), [errorManager]);

  // Enhanced error handling methods
  const setFieldError = useCallback(
    (
      fieldPath: string,
      error: FieldError | undefined,
      isDirty = false,
      isTouched = false,
      isValidating = false,
      meta?: FieldMetadata
    ) => {
      errorManager.setFieldError(
        fieldPath,
        error,
        isDirty,
        isTouched,
        isValidating,
        meta
      );
    },
    [errorManager]
  );

  const clearFieldError = useCallback(
    (fieldPath: string) => {
      errorManager.clearFieldError(fieldPath);
    },
    [errorManager]
  );

  const clearAllErrors = useCallback(() => {
    errorManager.clearAllErrors();
  }, [errorManager]);

  const hasFieldError = useCallback(
    (fieldPath: string) => {
      return errorManager.hasFieldError(fieldPath);
    },
    [errorManager]
  );

  const getErrorFieldPaths = useCallback(() => {
    return errorManager.getErrorFieldPaths();
  }, [errorManager]);

  const shouldShowError = useCallback(
    (fieldPath: string, meta: FieldMetadata, isSubmitted = false) => {
      return errorManager.shouldShowError(fieldPath, meta, isSubmitted);
    },
    [errorManager]
  );

  const formatErrorMessage = useCallback(
    (error: FieldError, fieldName: string, meta: FieldMetadata) => {
      return errorManager.formatErrorMessage(error, fieldName, meta);
    },
    [errorManager]
  );

  const setFieldTouched = useCallback(
    (fieldPath: string, isTouched = true) => {
      errorManager.setFieldTouched(fieldPath, isTouched);
    },
    [errorManager]
  );

  const setFieldDirty = useCallback(
    (fieldPath: string, isDirty = true) => {
      errorManager.setFieldDirty(fieldPath, isDirty);
    },
    [errorManager]
  );

  const setFieldValidating = useCallback(
    (fieldPath: string, isValidating = true) => {
      errorManager.setFieldValidating(fieldPath, isValidating);
    },
    [errorManager]
  );

  const getFieldErrorState = useCallback(
    (fieldPath: string) => {
      return errorManager.getFieldErrorState(fieldPath);
    },
    [errorManager]
  );

  const isAnyFieldValidating = useCallback(() => {
    return errorManager.isAnyFieldValidating();
  }, [errorManager]);

  const getValidatingFieldPaths = useCallback(() => {
    return errorManager.getValidatingFieldPaths();
  }, [errorManager]);

  const getErrorSummary = useCallback(() => {
    return errorManager.getErrorSummary();
  }, [errorManager]);

  const batchUpdateErrors = useCallback(
    (
      updates: Array<{
        fieldPath: string;
        error?: FieldError;
        isDirty?: boolean;
        isTouched?: boolean;
        isValidating?: boolean;
      }>
    ) => {
      errorManager.batchUpdateErrors(updates);
    },
    [errorManager]
  );

  // Accessibility methods
  const announceFormErrors = useCallback(
    (fieldsWithMeta: Array<{ fieldPath: string; meta: FieldMetadata }>) => {
      errorManager.announceFormErrors(fieldsWithMeta);
    },
    [errorManager]
  );

  const announceFormSuccess = useCallback(
    (message?: string) => {
      errorManager.announceFormSuccess(message);
    },
    [errorManager]
  );

  const focusFirstErrorField = useCallback(() => {
    errorManager.focusFirstErrorField();
  }, [errorManager]);

  const setFieldAccessibility = useCallback(
    (fieldPath: string, meta: FieldMetadata, isRequired = false) => {
      errorManager.setFieldAccessibility(fieldPath, meta, isRequired);
    },
    [errorManager]
  );

  const associateErrorWithField = useCallback(
    (fieldPath: string, errorId: string) => {
      errorManager.associateErrorWithField(fieldPath, errorId);
    },
    [errorManager]
  );

  const generateErrorId = useCallback(
    (fieldPath: string) => {
      return errorManager.generateErrorId(fieldPath);
    },
    [errorManager]
  );

  const setupKeyboardNavigation = useCallback(
    (formElement: HTMLElement) => {
      errorManager.setupKeyboardNavigation(formElement);
    },
    [errorManager]
  );

  // Count total errors
  const errorCount = useMemo(() => {
    return errorManager.getErrorCount();
  }, [errorManager]);

  return {
    errors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    hasFieldError,
    getErrorFieldPaths,
    shouldShowError,
    formatErrorMessage,
    errorCount,
    // Enhanced methods
    setFieldTouched,
    setFieldDirty,
    setFieldValidating,
    getFieldErrorState,
    isAnyFieldValidating,
    getValidatingFieldPaths,
    getErrorSummary,
    batchUpdateErrors,
    // Accessibility methods
    announceFormErrors,
    announceFormSuccess,
    focusFirstErrorField,
    setFieldAccessibility,
    associateErrorWithField,
    generateErrorId,
    setupKeyboardNavigation,
    // Async validation methods
    validateFieldAsync,
    isFieldValidatingAsync,
    cancelFieldValidation,
    cancelAllValidations,
    getAsyncValidationResult,
  };
}
