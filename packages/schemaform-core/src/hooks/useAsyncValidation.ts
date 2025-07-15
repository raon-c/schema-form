import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FieldError } from 'react-hook-form';
import type { AsyncValidationState, ValidationResult } from '../types';
import { AsyncValidationManager } from '../utils/AsyncValidationManager';

export interface UseAsyncValidationProps {
  onValidationStateChange?: (state: AsyncValidationState) => void;
  defaultDebounceMs?: number;
  cacheMaxAge?: number;
}

export interface UseAsyncValidationReturn {
  // Validation state
  validationState: AsyncValidationState;
  isFieldValidating: (fieldPath: string) => boolean;
  isAnyFieldValidating: () => boolean;
  getValidatingFields: () => string[];
  
  // Validation execution
  validateField: (
    fieldPath: string,
    validationFn: () => Promise<boolean | FieldError | null>,
    options?: {
      debounceMs?: number;
      cacheKey?: string;
      abortPrevious?: boolean;
    }
  ) => Promise<ValidationResult>;
  
  // Validation control
  cancelFieldValidation: (fieldPath: string) => Promise<void>;
  cancelAllValidations: () => Promise<void>;
  
  // Results and cache
  getValidationResult: (fieldPath: string) => ValidationResult | undefined;
  getCachedResult: (cacheKey: string) => ValidationResult | undefined;
  clearCache: () => void;
  clearResult: (key: string) => void;
  
  // Statistics and cleanup
  getValidationStats: () => {
    activeValidations: number;
    cachedResults: number;
    totalResults: number;
  };
  cleanupExpiredCache: () => void;
  reset: () => void;
}

export function useAsyncValidation({
  onValidationStateChange,
  defaultDebounceMs = 300,
  cacheMaxAge = 5 * 60 * 1000, // 5 minutes
}: UseAsyncValidationProps = {}): UseAsyncValidationReturn {
  // State for triggering re-renders
  const [, setRenderKey] = useState(0);
  const forceRerender = useCallback(() => setRenderKey(prev => prev + 1), []);

  // Ref to store abort controllers for each field
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Create AsyncValidationManager instance
  const validationManagerRef = useRef<AsyncValidationManager | null>(null);

  if (!validationManagerRef.current) {
    validationManagerRef.current = new AsyncValidationManager((state) => {
      onValidationStateChange?.(state);
      forceRerender();
    });
  }

  const validationManager = validationManagerRef.current;

  // Get current validation state
  const validationState = useMemo(() => 
    validationManager.getValidationState(), 
    [validationManager]
  );

  // Validation state queries
  const isFieldValidating = useCallback(
    (fieldPath: string) => validationManager.isFieldValidating(fieldPath),
    [validationManager]
  );

  const isAnyFieldValidating = useCallback(
    () => validationManager.isAnyFieldValidating(),
    [validationManager]
  );

  const getValidatingFields = useCallback(
    () => validationManager.getValidatingFields(),
    [validationManager]
  );

  // Validation execution
  const validateField = useCallback(
    async (
      fieldPath: string,
      validationFn: () => Promise<boolean | FieldError | null>,
      options: {
        debounceMs?: number;
        cacheKey?: string;
        abortPrevious?: boolean;
      } = {}
    ): Promise<ValidationResult> => {
      const {
        debounceMs = defaultDebounceMs,
        cacheKey,
        abortPrevious = true,
      } = options;

      // Create new abort controller for this validation
      let abortController: AbortController | undefined;
      
      if (abortPrevious) {
        // Cancel previous validation for this field
        const existingController = abortControllersRef.current.get(fieldPath);
        if (existingController) {
          existingController.abort();
        }

        // Create new abort controller
        abortController = new AbortController();
        abortControllersRef.current.set(fieldPath, abortController);
      }

      try {
        const validationOptions: {
          abortController?: AbortController;
          debounceMs?: number;
          cacheKey?: string;
        } = {};

        if (abortController) {
          validationOptions.abortController = abortController;
        }
        if (debounceMs !== undefined) {
          validationOptions.debounceMs = debounceMs;
        }
        if (cacheKey) {
          validationOptions.cacheKey = cacheKey;
        }

        const result = await validationManager.startValidation(
          fieldPath,
          validationFn,
          validationOptions
        );

        return result;
      } finally {
        // Clean up abort controller
        if (abortController) {
          abortControllersRef.current.delete(fieldPath);
        }
      }
    },
    [validationManager, defaultDebounceMs]
  );

  // Validation control
  const cancelFieldValidation = useCallback(
    async (fieldPath: string) => {
      // Abort the validation using abort controller
      const abortController = abortControllersRef.current.get(fieldPath);
      if (abortController) {
        abortController.abort();
        abortControllersRef.current.delete(fieldPath);
      }

      // Cancel validation in manager
      await validationManager.cancelValidation(fieldPath);
    },
    [validationManager]
  );

  const cancelAllValidations = useCallback(
    async () => {
      // Abort all validations using abort controllers
      for (const [fieldPath, abortController] of abortControllersRef.current.entries()) {
        abortController.abort();
      }
      abortControllersRef.current.clear();

      // Cancel all validations in manager
      await validationManager.cancelAllValidations();
    },
    [validationManager]
  );

  // Results and cache
  const getValidationResult = useCallback(
    (fieldPath: string) => validationManager.getValidationResult(fieldPath),
    [validationManager]
  );

  const getCachedResult = useCallback(
    (cacheKey: string) => validationManager.getCachedResult(cacheKey),
    [validationManager]
  );

  const clearCache = useCallback(
    () => validationManager.clearCache(),
    [validationManager]
  );

  const clearResult = useCallback(
    (key: string) => validationManager.clearResult(key),
    [validationManager]
  );

  // Statistics and cleanup
  const getValidationStats = useCallback(
    () => validationManager.getValidationStats(),
    [validationManager]
  );

  const cleanupExpiredCache = useCallback(
    () => validationManager.cleanupExpiredCache(cacheMaxAge),
    [validationManager, cacheMaxAge]
  );

  const reset = useCallback(
    () => {
      // Abort all ongoing validations
      for (const abortController of abortControllersRef.current.values()) {
        abortController.abort();
      }
      abortControllersRef.current.clear();

      // Reset validation manager
      validationManager.reset();
    },
    [validationManager]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all validations when component unmounts
      for (const abortController of abortControllersRef.current.values()) {
        abortController.abort();
      }
      abortControllersRef.current.clear();
    };
  }, []);

  // Periodic cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanupExpiredCache();
    }, cacheMaxAge);

    return () => clearInterval(cleanupInterval);
  }, [cleanupExpiredCache, cacheMaxAge]);

  return {
    // Validation state
    validationState,
    isFieldValidating,
    isAnyFieldValidating,
    getValidatingFields,
    
    // Validation execution
    validateField,
    
    // Validation control
    cancelFieldValidation,
    cancelAllValidations,
    
    // Results and cache
    getValidationResult,
    getCachedResult,
    clearCache,
    clearResult,
    
    // Statistics and cleanup
    getValidationStats,
    cleanupExpiredCache,
    reset,
  };
}