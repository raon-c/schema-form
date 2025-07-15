import { AsyncValidationManager, createAsyncValidationManager } from '../AsyncValidationManager';
import type { FieldError } from 'react-hook-form';

describe('AsyncValidationManager', () => {
  let validationManager: AsyncValidationManager;

  beforeEach(() => {
    validationManager = createAsyncValidationManager();
  });

  afterEach(() => {
    validationManager.reset();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const state = validationManager.getValidationState();
      
      expect(state.validatingFields.size).toBe(0);
      expect(state.validationPromises.size).toBe(0);
      expect(state.validationResults.size).toBe(0);
    });

    it('should not have any fields validating initially', () => {
      expect(validationManager.isAnyFieldValidating()).toBe(false);
      expect(validationManager.getValidatingFields()).toEqual([]);
    });
  });

  describe('validation execution', () => {
    it('should execute successful validation', async () => {
      const validationFn = jest.fn().mockResolvedValue(true);
      
      const result = await validationManager.startValidation('testField', validationFn);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.timestamp).toBeGreaterThan(0);
      expect(validationFn).toHaveBeenCalledTimes(1);
    });

    it('should execute failed validation', async () => {
      const validationFn = jest.fn().mockResolvedValue(false);
      
      const result = await validationManager.startValidation('testField', validationFn);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeUndefined();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should handle validation with error object', async () => {
      const errorObj: FieldError = { type: 'custom', message: 'Custom error' };
      const validationFn = jest.fn().mockResolvedValue(errorObj);
      
      const result = await validationManager.startValidation('testField', validationFn);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Custom error');
    });

    it('should handle validation exception', async () => {
      const validationFn = jest.fn().mockRejectedValue(new Error('Validation failed'));
      
      const result = await validationManager.startValidation('testField', validationFn);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('validation state tracking', () => {
    it('should track field validation state', async () => {
      let resolveValidation: (value: boolean) => void;
      const validationPromise = new Promise<boolean>((resolve) => {
        resolveValidation = resolve;
      });
      const validationFn = jest.fn().mockReturnValue(validationPromise);

      // Start validation (don't await yet)
      const resultPromise = validationManager.startValidation('testField', validationFn);

      // Check that field is being validated
      expect(validationManager.isFieldValidating('testField')).toBe(true);
      expect(validationManager.isAnyFieldValidating()).toBe(true);
      expect(validationManager.getValidatingFields()).toEqual(['testField']);

      // Resolve validation
      resolveValidation!(true);
      await resultPromise;

      // Check that field is no longer being validated
      expect(validationManager.isFieldValidating('testField')).toBe(false);
      expect(validationManager.isAnyFieldValidating()).toBe(false);
      expect(validationManager.getValidatingFields()).toEqual([]);
    });

    it('should handle multiple concurrent validations', async () => {
      const validationFn1 = jest.fn().mockResolvedValue(true);
      const validationFn2 = jest.fn().mockResolvedValue(false);

      // Start both validations
      const promise1 = validationManager.startValidation('field1', validationFn1);
      const promise2 = validationManager.startValidation('field2', validationFn2);

      // Wait for both to complete
      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(false);
      expect(validationManager.isAnyFieldValidating()).toBe(false);
    });
  });

  describe('validation cancellation', () => {
    it('should cancel field validation', async () => {
      let resolveValidation: (value: boolean) => void;
      const validationPromise = new Promise<boolean>((resolve) => {
        resolveValidation = resolve;
      });
      const validationFn = jest.fn().mockReturnValue(validationPromise);

      // Start validation
      const resultPromise = validationManager.startValidation('testField', validationFn);

      // Cancel validation
      await validationManager.cancelValidation('testField');

      // Check that field is no longer being validated
      expect(validationManager.isFieldValidating('testField')).toBe(false);

      // Resolve the original promise to avoid unhandled rejection
      resolveValidation!(true);
      await resultPromise.catch(() => {}); // Ignore the error
    });

    it('should cancel all validations', async () => {
      const validationFn1 = jest.fn().mockImplementation(() => new Promise(() => {}));
      const validationFn2 = jest.fn().mockImplementation(() => new Promise(() => {}));

      // Start multiple validations
      validationManager.startValidation('field1', validationFn1);
      validationManager.startValidation('field2', validationFn2);

      expect(validationManager.getValidatingFields()).toHaveLength(2);

      // Cancel all validations
      await validationManager.cancelAllValidations();

      expect(validationManager.isAnyFieldValidating()).toBe(false);
      expect(validationManager.getValidatingFields()).toEqual([]);
    });
  });

  describe('result caching', () => {
    it('should cache validation results', async () => {
      const validationFn = jest.fn().mockResolvedValue(true);
      const cacheKey = 'test-cache-key';

      const result = await validationManager.startValidation('testField', validationFn, {
        cacheKey,
      });

      expect(result.isValid).toBe(true);
      
      const cachedResult = validationManager.getCachedResult(cacheKey);
      expect(cachedResult).toEqual(result);
    });

    it('should return cached result for valid cache', async () => {
      const validationFn = jest.fn().mockResolvedValue(true);
      const cacheKey = 'test-cache-key';

      // First validation
      await validationManager.startValidation('testField', validationFn, { cacheKey });
      
      // Second validation with same cache key should use cache
      const result2 = await validationManager.startValidation('testField2', validationFn, { cacheKey });

      expect(result2.isValid).toBe(true);
      expect(validationFn).toHaveBeenCalledTimes(1); // Should only be called once due to caching
    });

    it('should clear cache', () => {
      validationManager.clearCache();
      
      const stats = validationManager.getValidationStats();
      expect(stats.cachedResults).toBe(0);
      expect(stats.totalResults).toBe(0);
    });
  });

  describe('debouncing', () => {
    it('should debounce validation', async () => {
      const validationFn = jest.fn().mockResolvedValue(true);
      const debounceMs = 100;

      const startTime = Date.now();
      const result = await validationManager.startValidation('testField', validationFn, {
        debounceMs,
      });
      const endTime = Date.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeGreaterThanOrEqual(debounceMs);
      expect(validationFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('abort controller support', () => {
    it('should support abort controller', async () => {
      const abortController = new AbortController();
      const validationFn = jest.fn().mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve(true), 1000))
      );

      // Start validation
      const resultPromise = validationManager.startValidation('testField', validationFn, {
        abortController,
      });

      // Abort after a short delay
      setTimeout(() => abortController.abort(), 50);

      // Should reject with abort error
      await expect(resultPromise).rejects.toThrow('Validation aborted');
    });
  });

  describe('statistics and cleanup', () => {
    it('should provide validation statistics', async () => {
      const validationFn = jest.fn().mockResolvedValue(true);
      
      await validationManager.startValidation('testField', validationFn);
      
      const stats = validationManager.getValidationStats();
      expect(stats.activeValidations).toBe(0);
      expect(stats.totalResults).toBe(1);
    });

    it('should cleanup expired cache entries', async () => {
      const validationFn = jest.fn().mockResolvedValue(true);
      
      await validationManager.startValidation('testField', validationFn);
      
      // Cleanup with very short max age to expire all entries
      validationManager.cleanupExpiredCache(1);
      
      const stats = validationManager.getValidationStats();
      expect(stats.cachedResults).toBe(0);
    });

    it('should reset all state', async () => {
      const validationFn = jest.fn().mockResolvedValue(true);
      
      await validationManager.startValidation('testField', validationFn);
      
      validationManager.reset();
      
      const state = validationManager.getValidationState();
      expect(state.validatingFields.size).toBe(0);
      expect(state.validationResults.size).toBe(0);
    });
  });
});