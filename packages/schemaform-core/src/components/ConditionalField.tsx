/**
 * ConditionalField - React component wrapper for conditional field rendering with transitions
 */

import React, { useEffect, useRef } from 'react';
import type { ConditionalFieldState } from '../utils/ConditionalFieldManager';

export interface ConditionalFieldProps {
  fieldPath: string;
  isVisible: boolean;
  transitionState: ConditionalFieldState['transitionState'];
  shouldRender: boolean;
  children: React.ReactNode;
  onTransitionEnd?: () => void;
  className?: string;
}

export const ConditionalField: React.FC<ConditionalFieldProps> = ({
  fieldPath,
  isVisible,
  transitionState,
  shouldRender,
  children,
  onTransitionEnd,
  className = '',
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const previousVisibleRef = useRef(isVisible);

  // Handle transition end events
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTransitionEnd = (event: TransitionEvent) => {
      // Only handle transitions on this element, not child elements
      if (event.target === element) {
        onTransitionEnd?.();
      }
    };

    element.addEventListener('transitionend', handleTransitionEnd);
    return () => {
      element.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [onTransitionEnd]);

  // Update max-height dynamically for smooth transitions
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (transitionState === 'entering') {
      // Measure the natural height and set it for smooth transition
      const scrollHeight = element.scrollHeight;
      element.style.maxHeight = `${scrollHeight}px`;
    } else if (transitionState === 'entered') {
      // Remove max-height constraint once fully visible
      element.style.maxHeight = 'none';
    } else if (transitionState === 'exiting') {
      // Set current height then transition to 0
      const currentHeight = element.offsetHeight;
      element.style.maxHeight = `${currentHeight}px`;
      // Force reflow then set to 0
      element.offsetHeight;
      element.style.maxHeight = '0px';
    }
  }, [transitionState]);

  // Track visibility changes for accessibility announcements
  useEffect(() => {
    if (previousVisibleRef.current !== isVisible) {
      previousVisibleRef.current = isVisible;
      
      // Announce visibility changes to screen readers
      if (isVisible) {
        // Field is becoming visible
        const announcement = `Field ${fieldPath} is now visible`;
        announceToScreenReader(announcement);
      } else {
        // Field is becoming hidden
        const announcement = `Field ${fieldPath} is now hidden`;
        announceToScreenReader(announcement);
      }
    }
  }, [isVisible, fieldPath]);

  // Don't render if field should not be rendered
  if (!shouldRender) {
    return null;
  }

  const baseClasses = 'sf-conditional-field';
  const stateClass = `sf-conditional-field--${transitionState}`;
  const combinedClassName = `${baseClasses} ${stateClass} ${className}`.trim();

  return (
    <div
      ref={elementRef}
      className={combinedClassName}
      data-field-path={fieldPath}
      data-visible={isVisible}
      data-transition-state={transitionState}
      aria-hidden={!isVisible}
      style={{
        // Ensure proper transition behavior
        transition: 'all var(--sf-transition-duration, 0.3s) var(--sf-transition-easing, ease-in-out)',
      }}
    >
      {children}
    </div>
  );
};

/**
 * Utility function to announce messages to screen readers
 */
function announceToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  document.body.appendChild(announcement);
  announcement.textContent = message;
  
  // Remove the announcement element after a delay
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, 1000);
}

export default ConditionalField;