/**
 * ConditionalFieldManager - Manages conditional field visibility, transitions, and data cleanup
 */

import type { FieldMetadata } from '../types';

export interface ConditionalFieldState {
  isVisible: boolean;
  wasVisible: boolean;
  transitionState: 'entering' | 'entered' | 'exiting' | 'exited';
  shouldRender: boolean;
  preservedValue?: any; // Store field value when hidden
  preservedError?: any; // Store field error when hidden
}

export interface ConditionalFieldManagerOptions {
  transitionDuration?: number;
  onFieldShow?: (fieldPath: string) => void;
  onFieldHide?: (fieldPath: string) => void;
  onTransitionComplete?: (fieldPath: string, isVisible: boolean) => void;
}

export class ConditionalFieldManager {
  private fieldStates = new Map<string, ConditionalFieldState>();
  private transitionTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private options: ConditionalFieldManagerOptions;

  constructor(options: ConditionalFieldManagerOptions = {}) {
    this.options = {
      transitionDuration: 300,
      ...options,
    };
  }

  /**
   * Evaluates field visibility based on display condition
   */
  evaluateFieldVisibility(
    fieldPath: string,
    meta: FieldMetadata,
    formValues: any
  ): boolean {
    const displayCondition = meta?.displayCondition;
    if (!displayCondition) {
      return true; // Always visible if no condition
    }

    try {
      return displayCondition(formValues);
    } catch (error) {
      console.warn(`Error evaluating display condition for field ${fieldPath}:`, error);
      return true; // Default to visible on error
    }
  }

  /**
   * Updates field visibility state and manages transitions
   */
  updateFieldVisibility(
    fieldPath: string,
    isVisible: boolean
  ): ConditionalFieldState {
    const currentState = this.fieldStates.get(fieldPath) || {
      isVisible: true,
      wasVisible: true,
      transitionState: 'entered',
      shouldRender: true,
    };

    // No change needed
    if (currentState.isVisible === isVisible) {
      return currentState;
    }

    // Clear any existing transition timeout
    const existingTimeout = this.transitionTimeouts.get(fieldPath);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.transitionTimeouts.delete(fieldPath);
    }

    let newState: ConditionalFieldState;

    if (isVisible) {
      // Field is becoming visible
      newState = {
        isVisible: true,
        wasVisible: currentState.isVisible,
        transitionState: 'entering',
        shouldRender: true,
      };

      // Trigger show callback
      this.options.onFieldShow?.(fieldPath);

      // Transition to entered state
      const timeout = setTimeout(() => {
        const enteredState: ConditionalFieldState = {
          ...newState,
          transitionState: 'entered',
        };
        this.fieldStates.set(fieldPath, enteredState);
        this.transitionTimeouts.delete(fieldPath);
        this.options.onTransitionComplete?.(fieldPath, true);
      }, 50); // Small delay to ensure CSS transition triggers

      this.transitionTimeouts.set(fieldPath, timeout);
    } else {
      // Field is becoming hidden
      newState = {
        isVisible: false,
        wasVisible: currentState.isVisible,
        transitionState: 'exiting',
        shouldRender: true, // Keep rendering during exit transition
      };

      // Trigger hide callback
      this.options.onFieldHide?.(fieldPath);

      // Transition to exited state after animation
      const timeout = setTimeout(() => {
        const exitedState: ConditionalFieldState = {
          ...newState,
          transitionState: 'exited',
          shouldRender: false, // Stop rendering after transition
        };
        this.fieldStates.set(fieldPath, exitedState);
        this.transitionTimeouts.delete(fieldPath);
        this.options.onTransitionComplete?.(fieldPath, false);
      }, this.options.transitionDuration || 300);

      this.transitionTimeouts.set(fieldPath, timeout);
    }

    this.fieldStates.set(fieldPath, newState);
    return newState;
  }

  /**
   * Gets the current state of a field
   */
  getFieldState(fieldPath: string): ConditionalFieldState {
    return this.fieldStates.get(fieldPath) || {
      isVisible: true,
      wasVisible: true,
      transitionState: 'entered',
      shouldRender: true,
    };
  }

  /**
   * Gets CSS class names for field transition state
   */
  getFieldTransitionClasses(fieldPath: string): string {
    const state = this.getFieldState(fieldPath);
    const baseClass = 'sf-conditional-field';
    const stateClass = `sf-conditional-field--${state.transitionState}`;
    return `${baseClass} ${stateClass}`;
  }

  /**
   * Determines if a field should be rendered (visible or transitioning)
   */
  shouldRenderField(fieldPath: string): boolean {
    const state = this.getFieldState(fieldPath);
    return state.shouldRender;
  }

  /**
   * Gets all currently hidden field paths
   */
  getHiddenFieldPaths(): string[] {
    const hiddenPaths: string[] = [];
    for (const [fieldPath, state] of this.fieldStates.entries()) {
      if (!state.isVisible) {
        hiddenPaths.push(fieldPath);
      }
    }
    return hiddenPaths;
  }

  /**
   * Gets all currently visible field paths
   */
  getVisibleFieldPaths(): string[] {
    const visiblePaths: string[] = [];
    for (const [fieldPath, state] of this.fieldStates.entries()) {
      if (state.isVisible) {
        visiblePaths.push(fieldPath);
      }
    }
    return visiblePaths;
  }

  /**
   * Cleans up resources and timeouts
   */
  cleanup(): void {
    // Clear all transition timeouts
    for (const timeout of this.transitionTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.transitionTimeouts.clear();
    this.fieldStates.clear();
  }

  /**
   * Resets all field states (useful for form reset)
   */
  resetAllFields(): void {
    this.cleanup();
    // All fields start as visible by default
  }

  /**
   * Force sets a field's visibility state (bypasses transitions)
   */
  setFieldVisibility(fieldPath: string, isVisible: boolean): void {
    const state: ConditionalFieldState = {
      isVisible,
      wasVisible: isVisible,
      transitionState: isVisible ? 'entered' : 'exited',
      shouldRender: isVisible,
    };
    this.fieldStates.set(fieldPath, state);
  }

  /**
   * Preserves field value and error when field becomes hidden
   */
  preserveFieldState(fieldPath: string, value: any, error?: any): void {
    const currentState = this.getFieldState(fieldPath);
    const updatedState: ConditionalFieldState = {
      ...currentState,
      preservedValue: value,
      preservedError: error,
    };
    this.fieldStates.set(fieldPath, updatedState);
  }

  /**
   * Gets preserved field value for a hidden field
   */
  getPreservedValue(fieldPath: string): any {
    const state = this.getFieldState(fieldPath);
    return state.preservedValue;
  }

  /**
   * Gets preserved field error for a hidden field
   */
  getPreservedError(fieldPath: string): any {
    const state = this.getFieldState(fieldPath);
    return state.preservedError;
  }

  /**
   * Checks if a field has preserved state
   */
  hasPreservedState(fieldPath: string): boolean {
    const state = this.getFieldState(fieldPath);
    return state.preservedValue !== undefined || state.preservedError !== undefined;
  }

  /**
   * Clears preserved state for a field
   */
  clearPreservedState(fieldPath: string): void {
    const currentState = this.getFieldState(fieldPath);
    const updatedState: ConditionalFieldState = {
      ...currentState,
      preservedValue: undefined,
      preservedError: undefined,
    };
    this.fieldStates.set(fieldPath, updatedState);
  }

  /**
   * Gets all fields that have preserved state
   */
  getFieldsWithPreservedState(): string[] {
    const fieldsWithState: string[] = [];
    for (const [fieldPath, state] of this.fieldStates.entries()) {
      if (state.preservedValue !== undefined || state.preservedError !== undefined) {
        fieldsWithState.push(fieldPath);
      }
    }
    return fieldsWithState;
  }
}

/**
 * Hook-like function to create and manage conditional field state
 */
export function createConditionalFieldManager(
  options?: ConditionalFieldManagerOptions
): ConditionalFieldManager {
  return new ConditionalFieldManager(options);
}