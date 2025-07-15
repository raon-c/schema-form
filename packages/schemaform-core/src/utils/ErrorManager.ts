import type { FieldError } from 'react-hook-form';
import type {
  ErrorDisplayOptions,
  ErrorMessages,
  FieldErrorState,
  FieldMetadata,
  FormErrorState,
} from '../types';
import {
  type AccessibilityManager,
  getAccessibilityManager,
} from './AccessibilityManager';
import {
  clearAllErrors as clearAllErrorsUtil,
  clearFieldError as clearFieldErrorUtil,
  createFieldErrorState,
  defaultErrorMessages,
  getErrorFieldPaths,
  getFieldErrorMessage,
  hasFieldError,
} from './errorHandling';

/**
 * Enhanced error manager with comprehensive error state tracking
 * and configurable display conditions
 */
export class ErrorManager {
  private errorState: FormErrorState = {};
  private displayOptions: ErrorDisplayOptions;
  private errorMessages: ErrorMessages;
  private onErrorCallback: ((errors: FormErrorState) => void) | undefined;
  private accessibilityManager: AccessibilityManager;

  constructor(
    displayOptions: ErrorDisplayOptions = {},
    errorMessages: ErrorMessages = defaultErrorMessages,
    onError?: (errors: FormErrorState) => void
  ) {
    this.displayOptions = {
      showErrorsOnTouch: true,
      showErrorsOnSubmit: false,
      showErrorsOnBlur: false,
      showErrorsOnChange: false,
      clearErrorsOnFocus: false,
      errorDisplayDelay: 0,
      groupErrors: false,
      ...displayOptions,
    };
    this.errorMessages = errorMessages;
    this.onErrorCallback = onError || undefined;
    this.accessibilityManager = getAccessibilityManager();
  }

  /**
   * Get current error state
   */
  getErrorState(): FormErrorState {
    return { ...this.errorState };
  }

  /**
   * Set error for a specific field with accessibility support
   */
  setFieldError(
    fieldPath: string,
    error: FieldError | undefined,
    isDirty = false,
    isTouched = false,
    isValidating = false,
    meta?: FieldMetadata
  ): void {
    const errorState = createFieldErrorState(
      error,
      isDirty,
      isTouched,
      isValidating
    );

    this.errorState = {
      ...this.errorState,
      [fieldPath]: errorState,
    };

    // Update accessibility attributes
    if (error && meta) {
      this.accessibilityManager.setFieldAriaInvalid(fieldPath, true);
      const errorMessage = this.formatErrorMessage(error, fieldPath, meta);
      this.accessibilityManager.announceError(fieldPath, errorMessage, meta);
    } else {
      this.accessibilityManager.setFieldAriaInvalid(fieldPath, false);
    }

    this.notifyErrorChange();
  }

  /**
   * Clear error for a specific field with accessibility support
   */
  clearFieldError(fieldPath: string): void {
    this.errorState = clearFieldErrorUtil(this.errorState, fieldPath);

    // Clear accessibility attributes
    this.accessibilityManager.setFieldAriaInvalid(fieldPath, false);
    this.accessibilityManager.removeErrorAssociation(fieldPath);
    this.accessibilityManager.clearErrorAnnouncement(fieldPath);

    this.notifyErrorChange();
  }

  /**
   * Clear all errors with accessibility support
   */
  clearAllErrors(): void {
    // Clear accessibility attributes for all fields with errors
    const errorFieldPaths = this.getErrorFieldPaths();
    errorFieldPaths.forEach(fieldPath => {
      this.accessibilityManager.setFieldAriaInvalid(fieldPath, false);
      this.accessibilityManager.removeErrorAssociation(fieldPath);
      this.accessibilityManager.clearErrorAnnouncement(fieldPath);
    });

    this.errorState = clearAllErrorsUtil(this.errorState);
    this.notifyErrorChange();
  }

  /**
   * Check if field has error
   */
  hasFieldError(fieldPath: string): boolean {
    return hasFieldError(this.errorState, fieldPath);
  }

  /**
   * Get all field paths with errors
   */
  getErrorFieldPaths(): string[] {
    return getErrorFieldPaths(this.errorState);
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return Object.values(this.errorState).filter(error => error.hasError)
      .length;
  }

  /**
   * Enhanced shouldShowError logic with configurable display conditions
   */
  shouldShowError(
    fieldPath: string,
    meta: FieldMetadata,
    isSubmitted = false
  ): boolean {
    const fieldError = this.errorState[fieldPath];
    if (!fieldError?.hasError) return false;

    // Field-level overrides take priority
    if (meta.showErrorOnTouch !== undefined) {
      return meta.showErrorOnTouch ? fieldError.isTouched : true;
    }

    // Check display conditions based on configuration
    if (this.displayOptions.showErrorsOnSubmit && isSubmitted) return true;
    if (this.displayOptions.showErrorsOnTouch && fieldError.isTouched)
      return true;
    if (this.displayOptions.showErrorsOnBlur && fieldError.isDirty) return true;
    if (this.displayOptions.showErrorsOnChange && fieldError.isDirty)
      return true;

    return false;
  }

  /**
   * Format error message with field-specific and global customization
   */
  formatErrorMessage(
    error: FieldError,
    fieldName: string,
    meta: FieldMetadata
  ): string {
    return getFieldErrorMessage(error, fieldName, meta, this.errorMessages);
  }

  /**
   * Update field touch state
   */
  setFieldTouched(fieldPath: string, isTouched = true): void {
    const currentError = this.errorState[fieldPath];
    if (currentError) {
      this.errorState = {
        ...this.errorState,
        [fieldPath]: {
          ...currentError,
          isTouched,
        },
      };
      this.notifyErrorChange();
    }
  }

  /**
   * Update field dirty state
   */
  setFieldDirty(fieldPath: string, isDirty = true): void {
    const currentError = this.errorState[fieldPath];
    if (currentError) {
      this.errorState = {
        ...this.errorState,
        [fieldPath]: {
          ...currentError,
          isDirty,
        },
      };
      this.notifyErrorChange();
    }
  }

  /**
   * Update field validation state
   */
  setFieldValidating(fieldPath: string, isValidating = true): void {
    const currentError = this.errorState[fieldPath];
    if (currentError) {
      this.errorState = {
        ...this.errorState,
        [fieldPath]: {
          ...currentError,
          isValidating,
        },
      };
      this.notifyErrorChange();
    } else {
      // Create new error state for validation tracking
      this.errorState = {
        ...this.errorState,
        [fieldPath]: createFieldErrorState(
          undefined,
          false,
          false,
          isValidating
        ),
      };
      this.notifyErrorChange();
    }
  }

  /**
   * Get field error state
   */
  getFieldErrorState(fieldPath: string): FieldErrorState | undefined {
    return this.errorState[fieldPath];
  }

  /**
   * Check if any field is currently validating
   */
  isAnyFieldValidating(): boolean {
    return Object.values(this.errorState).some(error => error.isValidating);
  }

  /**
   * Get all validating field paths
   */
  getValidatingFieldPaths(): string[] {
    return Object.keys(this.errorState).filter(
      path => this.errorState[path]?.isValidating
    );
  }

  /**
   * Update display options
   */
  updateDisplayOptions(options: Partial<ErrorDisplayOptions>): void {
    this.displayOptions = {
      ...this.displayOptions,
      ...options,
    };
  }

  /**
   * Update error messages
   */
  updateErrorMessages(messages: Partial<ErrorMessages>): void {
    this.errorMessages = {
      ...this.errorMessages,
      ...messages,
    };
  }

  /**
   * Reset error manager state
   */
  reset(): void {
    this.errorState = {};
    this.notifyErrorChange();
  }

  /**
   * Batch update multiple field errors
   */
  batchUpdateErrors(
    updates: Array<{
      fieldPath: string;
      error?: FieldError;
      isDirty?: boolean;
      isTouched?: boolean;
      isValidating?: boolean;
    }>
  ): void {
    const newErrorState = { ...this.errorState };

    updates.forEach(
      ({ fieldPath, error, isDirty, isTouched, isValidating }) => {
        const currentError = newErrorState[fieldPath];
        newErrorState[fieldPath] = createFieldErrorState(
          error,
          isDirty ?? currentError?.isDirty ?? false,
          isTouched ?? currentError?.isTouched ?? false,
          isValidating ?? currentError?.isValidating ?? false
        );
      }
    );

    this.errorState = newErrorState;
    this.notifyErrorChange();
  }

  /**
   * Get error summary for debugging
   */
  getErrorSummary(): {
    totalErrors: number;
    validatingFields: number;
    touchedFields: number;
    dirtyFields: number;
    errorsByType: Record<string, number>;
  } {
    const errors = Object.values(this.errorState);
    const errorsByType: Record<string, number> = {};

    errors.forEach(error => {
      if (error.hasError && error.error?.type) {
        errorsByType[error.error.type] =
          (errorsByType[error.error.type] || 0) + 1;
      }
    });

    return {
      totalErrors: errors.filter(e => e.hasError).length,
      validatingFields: errors.filter(e => e.isValidating).length,
      touchedFields: errors.filter(e => e.isTouched).length,
      dirtyFields: errors.filter(e => e.isDirty).length,
      errorsByType,
    };
  }

  /**
   * Announce form submission errors to screen readers
   */
  announceFormErrors(
    fieldsWithMeta: Array<{ fieldPath: string; meta: FieldMetadata }>
  ): void {
    const errorFields = fieldsWithMeta.filter(({ fieldPath }) =>
      this.hasFieldError(fieldPath)
    );

    if (errorFields.length === 0) return;

    const errors = errorFields.map(({ fieldPath, meta }) => {
      const fieldError = this.errorState[fieldPath];
      const errorMessage = fieldError?.error
        ? this.formatErrorMessage(fieldError.error, fieldPath, meta)
        : 'Validation error';

      return {
        fieldName: fieldPath,
        message: errorMessage,
        meta,
      };
    });

    this.accessibilityManager.announceFormErrors(errors);
  }

  /**
   * Announce successful form submission
   */
  announceFormSuccess(message?: string): void {
    this.accessibilityManager.announceFormSuccess(message);
  }

  /**
   * Focus first field with error
   */
  focusFirstErrorField(): void {
    const errorFieldPaths = this.getErrorFieldPaths();
    this.accessibilityManager.focusFirstErrorField(errorFieldPaths);
  }

  /**
   * Set field accessibility attributes
   */
  setFieldAccessibility(
    fieldPath: string,
    meta: FieldMetadata,
    isRequired = false
  ): void {
    // Set required state
    this.accessibilityManager.setFieldRequired(fieldPath, isRequired);

    // Set label
    if (meta.label) {
      this.accessibilityManager.setFieldLabel(
        fieldPath,
        meta.label,
        meta.ariaLabel
      );
    }
  }

  /**
   * Associate error message with field
   */
  associateErrorWithField(fieldPath: string, errorId: string): void {
    this.accessibilityManager.associateErrorWithField(fieldPath, errorId);
  }

  /**
   * Generate unique error ID for field
   */
  generateErrorId(fieldPath: string): string {
    return this.accessibilityManager.generateErrorId(fieldPath);
  }

  /**
   * Setup keyboard navigation for form
   */
  setupKeyboardNavigation(formElement: HTMLElement): void {
    this.accessibilityManager.setupKeyboardNavigation(formElement);
  }

  /**
   * Get accessibility manager instance
   */
  getAccessibilityManager(): AccessibilityManager {
    return this.accessibilityManager;
  }

  /**
   * Private method to notify error state changes
   */
  private notifyErrorChange(): void {
    if (this.onErrorCallback) {
      this.onErrorCallback(this.getErrorState());
    }
  }
}

/**
 * Factory function to create ErrorManager instance
 */
export function createErrorManager(
  displayOptions?: ErrorDisplayOptions,
  errorMessages?: ErrorMessages,
  onError?: (errors: FormErrorState) => void
): ErrorManager {
  return new ErrorManager(displayOptions, errorMessages, onError);
}
