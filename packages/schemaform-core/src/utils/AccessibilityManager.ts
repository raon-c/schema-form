import type { FieldError } from 'react-hook-form';
import type { FieldMetadata } from '../types';

/**
 * Accessibility manager for ARIA error announcements and screen reader support
 */
export class AccessibilityManager {
  private liveRegion: HTMLElement | null = null;
  private fieldErrorAssociations: Map<string, string> = new Map();
  private announcementQueue: Array<{
    message: string;
    priority: 'polite' | 'assertive';
  }> = [];
  private isProcessingQueue = false;

  constructor() {
    this.initializeLiveRegion();
  }

  /**
   * Initialize ARIA live region for error announcements
   */
  private initializeLiveRegion(): void {
    if (typeof document === 'undefined') return;

    // Create live region for error announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('aria-relevant', 'additions text');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';
    this.liveRegion.className = 'schemaform-sr-only';

    document.body.appendChild(this.liveRegion);
  }

  /**
   * Announce error to screen readers
   */
  announceError(
    fieldName: string,
    errorMessage: string,
    meta: FieldMetadata,
    priority: 'polite' | 'assertive' = 'polite'
  ): void {
    const fieldLabel = meta.label || fieldName;
    const announcement = `${fieldLabel}: ${errorMessage}`;

    this.queueAnnouncement(announcement, priority);
  }

  /**
   * Clear error announcement for a specific field
   */
  clearErrorAnnouncement(fieldName: string): void {
    // Remove any queued announcements for this field
    this.announcementQueue = this.announcementQueue.filter(
      item => !item.message.startsWith(fieldName)
    );
  }

  /**
   * Set field ARIA invalid state
   */
  setFieldAriaInvalid(fieldName: string, isInvalid: boolean): void {
    if (typeof document === 'undefined') return;

    const fieldElement = this.getFieldElement(fieldName);
    if (fieldElement) {
      if (isInvalid) {
        fieldElement.setAttribute('aria-invalid', 'true');
      } else {
        fieldElement.removeAttribute('aria-invalid');
      }
    }
  }

  /**
   * Associate error message with field using aria-describedby
   */
  associateErrorWithField(fieldName: string, errorId: string): void {
    if (typeof document === 'undefined') return;

    const fieldElement = this.getFieldElement(fieldName);
    if (fieldElement) {
      const existingDescribedBy = fieldElement.getAttribute('aria-describedby');
      const describedByIds = existingDescribedBy
        ? existingDescribedBy.split(' ')
        : [];

      // Add error ID if not already present
      if (!describedByIds.includes(errorId)) {
        describedByIds.push(errorId);
        fieldElement.setAttribute('aria-describedby', describedByIds.join(' '));
      }

      // Store association for cleanup
      this.fieldErrorAssociations.set(fieldName, errorId);
    }
  }

  /**
   * Remove error association from field
   */
  removeErrorAssociation(fieldName: string): void {
    if (typeof document === 'undefined') return;

    const fieldElement = this.getFieldElement(fieldName);
    const errorId = this.fieldErrorAssociations.get(fieldName);

    if (fieldElement && errorId) {
      const existingDescribedBy = fieldElement.getAttribute('aria-describedby');
      if (existingDescribedBy) {
        const describedByIds = existingDescribedBy
          .split(' ')
          .filter(id => id !== errorId);

        if (describedByIds.length > 0) {
          fieldElement.setAttribute(
            'aria-describedby',
            describedByIds.join(' ')
          );
        } else {
          fieldElement.removeAttribute('aria-describedby');
        }
      }

      // Remove from associations
      this.fieldErrorAssociations.delete(fieldName);
    }
  }

  /**
   * Generate unique error ID for field
   */
  generateErrorId(fieldName: string): string {
    return `${fieldName}-error-${Date.now()}`;
  }

  /**
   * Set field label association using aria-labelledby or aria-label
   */
  setFieldLabel(fieldName: string, label: string, labelId?: string): void {
    if (typeof document === 'undefined') return;

    const fieldElement = this.getFieldElement(fieldName);
    if (fieldElement) {
      if (labelId) {
        fieldElement.setAttribute('aria-labelledby', labelId);
      } else {
        fieldElement.setAttribute('aria-label', label);
      }
    }
  }

  /**
   * Set field required state
   */
  setFieldRequired(fieldName: string, isRequired: boolean): void {
    if (typeof document === 'undefined') return;

    const fieldElement = this.getFieldElement(fieldName);
    if (fieldElement) {
      if (isRequired) {
        fieldElement.setAttribute('aria-required', 'true');
      } else {
        fieldElement.removeAttribute('aria-required');
      }
    }
  }

  /**
   * Announce form submission errors
   */
  announceFormErrors(
    errors: Array<{ fieldName: string; message: string; meta: FieldMetadata }>
  ): void {
    if (errors.length === 0) return;

    const errorCount = errors.length;
    const announcement =
      errorCount === 1
        ? `Form has 1 error: ${errors[0]?.message || 'Unknown error'}`
        : `Form has ${errorCount} errors. Please review and correct the following fields.`;

    this.queueAnnouncement(announcement, 'assertive');

    // Announce individual errors with a delay
    errors.forEach((error, index) => {
      setTimeout(
        () => {
          this.announceError(
            error.fieldName,
            error.message,
            error.meta,
            'polite'
          );
        },
        (index + 1) * 500
      );
    });
  }

  /**
   * Announce successful form submission
   */
  announceFormSuccess(message = 'Form submitted successfully'): void {
    this.queueAnnouncement(message, 'polite');
  }

  /**
   * Focus management for error fields
   */
  focusFirstErrorField(errorFieldNames: string[]): void {
    if (errorFieldNames.length === 0) return;

    const firstFieldName = errorFieldNames[0];
    if (firstFieldName) {
      const firstErrorField = this.getFieldElement(firstFieldName);
      if (firstErrorField && typeof firstErrorField.focus === 'function') {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          firstErrorField.focus();
        }, 100);
      }
    }
  }

  /**
   * Set up keyboard navigation helpers
   */
  setupKeyboardNavigation(formElement: HTMLElement): void {
    if (typeof document === 'undefined') return;

    // Add keyboard event listeners for enhanced navigation
    formElement.addEventListener(
      'keydown',
      this.handleKeyboardNavigation.bind(this)
    );
  }

  /**
   * Handle keyboard navigation within form
   */
  private handleKeyboardNavigation(event: KeyboardEvent): void {
    // Ctrl/Cmd + E: Focus first error field
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
      event.preventDefault();
      const errorFields = Array.from(this.fieldErrorAssociations.keys());
      this.focusFirstErrorField(errorFields);
    }
  }

  /**
   * Queue announcement for screen readers
   */
  private queueAnnouncement(
    message: string,
    priority: 'polite' | 'assertive'
  ): void {
    this.announcementQueue.push({ message, priority });
    this.processAnnouncementQueue();
  }

  /**
   * Process queued announcements
   */
  private async processAnnouncementQueue(): Promise<void> {
    if (this.isProcessingQueue || this.announcementQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.announcementQueue.length > 0) {
      const announcement = this.announcementQueue.shift();
      if (announcement && this.liveRegion) {
        // Update live region aria-live attribute based on priority
        this.liveRegion.setAttribute('aria-live', announcement.priority);

        // Clear previous content and add new announcement
        this.liveRegion.textContent = '';

        // Small delay to ensure screen readers detect the change
        await new Promise(resolve => setTimeout(resolve, 50));

        this.liveRegion.textContent = announcement.message;

        // Wait before processing next announcement
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get field element by name
   */
  private getFieldElement(fieldName: string): HTMLElement | null {
    if (typeof document === 'undefined') return null;

    // Try multiple selectors to find the field
    const selectors = [
      `[name="${fieldName}"]`,
      `[data-field-name="${fieldName}"]`,
      `#${fieldName}`,
      `[id*="${fieldName}"]`,
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) return element;
    }

    return null;
  }

  /**
   * Create error message element with proper ARIA attributes
   */
  createErrorMessageElement(
    fieldName: string,
    error: FieldError,
    _meta: FieldMetadata
  ): HTMLElement {
    if (typeof document === 'undefined') {
      throw new Error('Cannot create DOM elements in non-browser environment');
    }

    const errorElement = document.createElement('div');
    const errorId = this.generateErrorId(fieldName);

    errorElement.id = errorId;
    errorElement.className = 'schemaform-error-message';
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    errorElement.textContent = error.message || 'Validation error';

    // Associate with field
    this.associateErrorWithField(fieldName, errorId);

    return errorElement;
  }

  /**
   * Cleanup accessibility manager
   */
  cleanup(): void {
    // Clear all field associations
    this.fieldErrorAssociations.forEach((_errorId, fieldName) => {
      this.removeErrorAssociation(fieldName);
    });
    this.fieldErrorAssociations.clear();

    // Clear announcement queue
    this.announcementQueue = [];

    // Remove live region
    if (this.liveRegion?.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
      this.liveRegion = null;
    }
  }

  /**
   * Get accessibility summary for debugging
   */
  getAccessibilitySummary(): {
    hasLiveRegion: boolean;
    fieldAssociations: number;
    queuedAnnouncements: number;
    isProcessingQueue: boolean;
  } {
    return {
      hasLiveRegion: !!this.liveRegion,
      fieldAssociations: this.fieldErrorAssociations.size,
      queuedAnnouncements: this.announcementQueue.length,
      isProcessingQueue: this.isProcessingQueue,
    };
  }
}

/**
 * Global accessibility manager instance
 */
let globalAccessibilityManager: AccessibilityManager | null = null;

/**
 * Get or create global accessibility manager instance
 */
export function getAccessibilityManager(): AccessibilityManager {
  if (!globalAccessibilityManager) {
    globalAccessibilityManager = new AccessibilityManager();
  }
  return globalAccessibilityManager;
}

/**
 * Create a new accessibility manager instance
 */
export function createAccessibilityManager(): AccessibilityManager {
  return new AccessibilityManager();
}

/**
 * Cleanup global accessibility manager
 */
export function cleanupGlobalAccessibilityManager(): void {
  if (globalAccessibilityManager) {
    globalAccessibilityManager.cleanup();
    globalAccessibilityManager = null;
  }
}
