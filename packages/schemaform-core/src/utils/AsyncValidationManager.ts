import type { FieldError } from 'react-hook-form';
import type { AsyncValidationState, ValidationResult } from '../types';
import { ValidationCacheManager } from './ValidationCacheManager';

/**
 * Manager for handling asynchronous validation state and operations
 */
export class AsyncValidationManager {
  private validationState: AsyncValidationState;
  private onValidationStateChange: ((state: AsyncValidationState) => void) | undefined;
  private cacheManager: ValidationCacheManager;

  constructor(onStateChange?: (state: AsyncValidationState) => void) {
    this.validationState = {
      validatingFields: new Set<string>(),
      validationPromises: new Map<string, Promise<boolean>>(),
      validationResults: new Map<string, ValidationResult>(),
    };
    this.onValidationStateChange = onStateChange || undefined;
    this.cacheManager = new ValidationCacheManager();
  }

  /**
   * Get current validation state
   */
  getValidationState(): AsyncValidationState {
    return {
      validatingFields: new Set(this.validationState.validatingFields),
      validationPromises: new Map(this.validationState.validationPromises),
      validationResults: new Map(this.validationState.validationResults),
    };
  }

  /**
   * Check if a field is currently being validated
   */
  isFieldValidating(fieldPath: string): boolean {
    return this.validationState.validatingFields.has(fieldPath);
  }

  /**
   * Check if any field is currently being validated
   */
  isAnyFieldValidating(): boolean {
    return this.validationState.validatingFields.size > 0;
  }

  /**
   * Get all fields currently being validated
   */
  getValidatingFields(): string[] {
    return Array.from(this.validationState.validatingFields);
  }

  /**
   * Start async validation for a field
   */
  async startValidation(
    fieldPath: string,
    validationFn: () => Promise<boolean | FieldError | null>,
    options: {
      abortController?: AbortController;
      debounceMs?: number;
      cacheKey?: string;
    } = {}
  ): Promise<ValidationResult> {
    const { abortController, debounceMs = 0, cacheKey } = options;

    // Check cache first if cacheKey is provided
    if (cacheKey) {
      const cachedResult = this.cacheManager.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Cancel any existing validation for this field
    await this.cancelValidation(fieldPath);

    // Add field to validating set
    this.validationState.validatingFields.add(fieldPath);
    this.notifyStateChange();

    try {
      // Create validation promise with debouncing if specified
      const validationPromise =
        debounceMs > 0
          ? this.debounceValidation(validationFn, debounceMs, abortController)
          : this.executeValidation(validationFn, abortController);

      // Store the promise for potential cancellation
      this.validationState.validationPromises.set(fieldPath, validationPromise);

      // Execute validation
      const isValid = await validationPromise;

      // Create validation result
      const result: ValidationResult = {
        isValid: typeof isValid === 'boolean' ? isValid : false,
        timestamp: Date.now(),
      };

      // Add error message if validation failed with error object
      if (typeof isValid === 'object' && isValid !== null && 'message' in isValid) {
        const errorMessage = (isValid as FieldError).message;
        if (errorMessage) {
          result.error = errorMessage;
        }
      }

      // Store result in cache if cacheKey is provided
      if (cacheKey) {
        this.cacheManager.set(cacheKey, result, {
          priority: 'normal',
          tags: [fieldPath],
        });
      }

      // Store result for field
      this.validationState.validationResults.set(fieldPath, result);

      return result;
    } catch (error) {
      // Handle validation error
      const result: ValidationResult = {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        timestamp: Date.now(),
      };

      this.validationState.validationResults.set(fieldPath, result);
      return result;
    } finally {
      // Clean up validation state
      this.validationState.validatingFields.delete(fieldPath);
      this.validationState.validationPromises.delete(fieldPath);
      this.notifyStateChange();
    }
  }

  /**
   * Cancel validation for a specific field
   */
  async cancelValidation(fieldPath: string): Promise<void> {
    const existingPromise =
      this.validationState.validationPromises.get(fieldPath);
    if (existingPromise) {
      // The promise will be rejected, but we catch it to prevent unhandled rejection
      try {
        await existingPromise;
      } catch {
        // Ignore cancellation errors
      }

      this.validationState.validationPromises.delete(fieldPath);
      this.validationState.validatingFields.delete(fieldPath);
      this.notifyStateChange();
    }
  }

  /**
   * Cancel all ongoing validations
   */
  async cancelAllValidations(): Promise<void> {
    const promises = Array.from(
      this.validationState.validationPromises.values()
    );

    // Clear state immediately
    this.validationState.validatingFields.clear();
    this.validationState.validationPromises.clear();
    this.notifyStateChange();

    // Wait for all promises to settle
    await Promise.allSettled(promises);
  }

  /**
   * Get validation result for a field
   */
  getValidationResult(fieldPath: string): ValidationResult | undefined {
    return this.validationState.validationResults.get(fieldPath);
  }

  /**
   * Get cached validation result
   */
  getCachedResult(cacheKey: string): ValidationResult | undefined {
    return this.cacheManager.get(cacheKey);
  }

  /**
   * Check if cached result is still valid (within 5 minutes by default)
   */
  private isCacheValid(
    result: ValidationResult,
    maxAgeMs = 5 * 60 * 1000
  ): boolean {
    return Date.now() - result.timestamp < maxAgeMs;
  }

  /**
   * Clear validation results cache
   */
  clearCache(): void {
    this.cacheManager.clear();
    this.validationState.validationResults.clear();
  }

  /**
   * Clear validation result for specific field or cache key
   */
  clearResult(key: string): void {
    this.cacheManager.delete(key);
    this.validationState.validationResults.delete(key);
  }

  /**
   * Clear cached results by tags
   */
  clearCacheByTags(tags: string[]): number {
    return this.cacheManager.clearByTags(tags);
  }

  /**
   * Get enhanced cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    return this.cacheManager.getStats();
  }

  /**
   * Execute validation with abort controller support
   */
  private async executeValidation(
    validationFn: () => Promise<boolean | FieldError | null>,
    abortController?: AbortController
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Set up abort handling
      if (abortController) {
        if (abortController.signal.aborted) {
          reject(new Error('Validation aborted'));
          return;
        }

        const abortHandler = () => {
          reject(new Error('Validation aborted'));
        };

        abortController.signal.addEventListener('abort', abortHandler);

        // Clean up listener after validation
        validationFn()
          .then(result => {
            abortController.signal.removeEventListener('abort', abortHandler);
            resolve(typeof result === 'boolean' ? result : result === null);
          })
          .catch(error => {
            abortController.signal.removeEventListener('abort', abortHandler);
            reject(error);
          });
      } else {
        validationFn()
          .then(result =>
            resolve(typeof result === 'boolean' ? result : result === null)
          )
          .catch(reject);
      }
    });
  }

  /**
   * Execute validation with debouncing
   */
  private async debounceValidation(
    validationFn: () => Promise<boolean | FieldError | null>,
    debounceMs: number,
    abortController?: AbortController
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.executeValidation(validationFn, abortController)
          .then(resolve)
          .catch(reject);
      }, debounceMs);

      // Handle abort during debounce period
      if (abortController) {
        const abortHandler = () => {
          clearTimeout(timeoutId);
          reject(new Error('Validation aborted'));
        };

        if (abortController.signal.aborted) {
          clearTimeout(timeoutId);
          reject(new Error('Validation aborted'));
          return;
        }

        abortController.signal.addEventListener('abort', abortHandler, {
          once: true,
        });
      }
    });
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    activeValidations: number;
    cachedResults: number;
    totalResults: number;
  } {
    return {
      activeValidations: this.validationState.validatingFields.size,
      cachedResults: Array.from(
        this.validationState.validationResults.values()
      ).filter(result => this.isCacheValid(result)).length,
      totalResults: this.validationState.validationResults.size,
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache(maxAgeMs = 5 * 60 * 1000): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [
      key,
      result,
    ] of this.validationState.validationResults.entries()) {
      if (now - result.timestamp > maxAgeMs) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.validationState.validationResults.delete(key);
    });
  }

  /**
   * Reset all validation state
   */
  reset(): void {
    this.cancelAllValidations();
    this.validationState.validationResults.clear();
    this.cacheManager.clear();
  }

  /**
   * Destroy the validation manager and cleanup resources
   */
  destroy(): void {
    this.reset();
    this.cacheManager.destroy();
  }

  /**
   * Notify state change listeners
   */
  private notifyStateChange(): void {
    if (this.onValidationStateChange) {
      this.onValidationStateChange(this.getValidationState());
    }
  }
}

/**
 * Factory function to create AsyncValidationManager instance
 */
export function createAsyncValidationManager(
  onStateChange?: (state: AsyncValidationState) => void
): AsyncValidationManager {
  return new AsyncValidationManager(onStateChange);
}

/**
 * Global async validation manager instance
 */
let globalAsyncValidationManager: AsyncValidationManager | null = null;

/**
 * Get or create global async validation manager instance
 */
export function getAsyncValidationManager(): AsyncValidationManager {
  if (!globalAsyncValidationManager) {
    globalAsyncValidationManager = new AsyncValidationManager();
  }
  return globalAsyncValidationManager;
}

/**
 * Cleanup global async validation manager
 */
export function cleanupGlobalAsyncValidationManager(): void {
  if (globalAsyncValidationManager) {
    globalAsyncValidationManager.reset();
    globalAsyncValidationManager = null;
  }
}
