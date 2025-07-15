import { zodResolver } from '@hookform/resolvers/zod';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type { Control, DeepPartial, FieldError } from 'react-hook-form';
import { get, useForm } from 'react-hook-form';
import type { z } from 'zod/v4';
import type { $ZodType } from 'zod/v4/core';
import { useErrorHandling } from '../hooks/useErrorHandling';
import type { SchemaFormProps, SchemaFormRef } from '../types';
import { ConditionalFieldManager } from '../utils/ConditionalFieldManager';
import {
  extractFieldsFromSchema,
  getComponentTypeFromZodType,
} from '../utils/schema';
import { ConditionalField } from './ConditionalField';

export const SchemaForm = forwardRef<SchemaFormRef, SchemaFormProps<any>>(
  function SchemaForm<T extends $ZodType>(
    {
      schema,
      onSubmit,
      uiAdapter,
      defaultValues,
      control: externalControl,
      mode = 'onSubmit',
      renderFieldLayout: formRenderFieldLayout,
      errorMessages,
      errorDisplayOptions,
      onError,
      validateOnMount = false,
      formAriaLabel,
      formAriaDescribedBy,
      resetOnSubmit = false,
    }: SchemaFormProps<T>,
    ref: React.Ref<SchemaFormRef<T>>
  ) {
    // Enhanced control detection - check if external control is provided and valid
    const isControlled = React.useMemo(() => {
      return externalControl !== undefined && externalControl !== null;
    }, [externalControl]);

    // Enhanced error handling with ErrorManager
    const {
      errors: errorState,
      clearFieldError,
      shouldShowError,
      errorCount,
    } = useErrorHandling({
      ...(errorMessages && { errorMessages }),
      ...(errorDisplayOptions && { errorDisplayOptions }),
      ...(onError && { onError }),
    });

    // Conditional field manager for handling field visibility and transitions
    const conditionalFieldManagerRef = useRef<
      ConditionalFieldManager | undefined
    >(undefined);

    // Initialize conditional field manager
    if (!conditionalFieldManagerRef.current) {
      conditionalFieldManagerRef.current = new ConditionalFieldManager({
        transitionDuration: 300,
        onFieldShow: (fieldPath: string) => {
          // Clear validation errors when field becomes visible
          clearFieldError(fieldPath);
        },
        onFieldHide: (fieldPath: string) => {
          // Clear validation errors when field becomes hidden
          clearFieldError(fieldPath);
        },
      });
    }

    const conditionalFieldManager = conditionalFieldManagerRef.current;

    // Field state preservation utilities
    const preserveFieldState = useCallback(
      (fieldPath: string, formControl: any) => {
        if (!formControl || !conditionalFieldManager) return;

        try {
          // Get current field value and error
          const currentValue = formControl.getValues
            ? formControl.getValues(fieldPath)
            : undefined;
          const currentError = formControl.formState?.errors
            ? get(formControl.formState.errors, fieldPath)
            : undefined;

          // Preserve the state in conditional field manager
          conditionalFieldManager.preserveFieldState(
            fieldPath,
            currentValue,
            currentError
          );
        } catch (error) {
          console.warn(
            `Failed to preserve state for field ${fieldPath}:`,
            error
          );
        }
      },
      [conditionalFieldManager]
    );

    const restoreFieldState = useCallback(
      (fieldPath: string, formControl: any) => {
        if (
          !formControl ||
          !conditionalFieldManager ||
          !conditionalFieldManager.hasPreservedState(fieldPath)
        )
          return;

        try {
          // Get preserved state
          const preservedValue =
            conditionalFieldManager.getPreservedValue(fieldPath);
          const preservedError =
            conditionalFieldManager.getPreservedError(fieldPath);

          // Restore field value if it was preserved
          if (preservedValue !== undefined && formControl.setValue) {
            formControl.setValue(fieldPath, preservedValue, {
              shouldValidate: false,
              shouldDirty: true,
              shouldTouch: false,
            });
          }

          // Restore field error if it was preserved
          if (preservedError && formControl.setError) {
            formControl.setError(fieldPath, preservedError);
          }

          // Clear preserved state after restoration
          conditionalFieldManager.clearPreservedState(fieldPath);
        } catch (error) {
          console.warn(
            `Failed to restore state for field ${fieldPath}:`,
            error
          );
        }
      },
      [conditionalFieldManager]
    );

    // Cleanup conditional field manager on unmount
    useEffect(() => {
      return () => {
        conditionalFieldManager.cleanup();
      };
    }, [conditionalFieldManager]);

    // Utility function to filter out hidden fields from form data
    const filterHiddenFields = useCallback(
      (data: any): any => {
        const hiddenFieldPaths = conditionalFieldManager.getHiddenFieldPaths();
        if (hiddenFieldPaths.length === 0) {
          return data; // No hidden fields, return original data
        }

        // Create a deep copy of the data to avoid mutations
        const filteredData = JSON.parse(JSON.stringify(data));

        // Remove hidden field values from the data
        hiddenFieldPaths.forEach(fieldPath => {
          // Handle nested field paths (e.g., "user.profile.email")
          const pathParts = fieldPath.split('.');
          let current = filteredData;

          // Navigate to the parent object
          for (let i = 0; i < pathParts.length - 1; i++) {
            const pathPart = pathParts[i];
            if (
              current &&
              typeof current === 'object' &&
              pathPart &&
              pathPart in current
            ) {
              current = current[pathPart];
            } else {
              // Path doesn't exist, nothing to remove
              return;
            }
          }

          // Remove the final property
          const finalKey = pathParts[pathParts.length - 1];
          if (
            current &&
            typeof current === 'object' &&
            finalKey &&
            finalKey in current
          ) {
            delete current[finalKey];
          }
        });

        return filteredData;
      },
      [conditionalFieldManager]
    );

    const FormFields = ({
      control,
      errors,
      formValues,
      isSubmitted = false,
    }: {
      control: Control<any>;
      errors: any;
      formValues: any;
      isSubmitted?: boolean;
    }) => {
      // Extract fields from schema
      const fields = useMemo(() => extractFieldsFromSchema(schema), [schema]);

      return (
        <>
          {fields.map((field: any) => {
            const { path, meta, zodType } = field;

            // Evaluate field visibility using conditional field manager
            const isVisible = conditionalFieldManager.evaluateFieldVisibility(
              path,
              meta,
              formValues
            );

            // Get previous visibility state
            const previousState = conditionalFieldManager.getFieldState(path);
            const wasVisible = previousState.isVisible;

            // Update field visibility state and get transition state
            const fieldState = conditionalFieldManager.updateFieldVisibility(
              path,
              isVisible
            );

            // Handle field state preservation and restoration
            if (wasVisible && !isVisible) {
              // Field is becoming hidden - preserve its state
              preserveFieldState(path, control);
            } else if (!wasVisible && isVisible) {
              // Field is becoming visible - restore its state if available
              restoreFieldState(path, control);
            }

            // Don't render if field should not be rendered (completely hidden)
            if (!conditionalFieldManager.shouldRenderField(path)) {
              return null;
            }

            // Evaluate disabled condition
            const disabledCondition = meta?.disabledCondition;
            const isDisabled =
              !!meta?.disabled ||
              (disabledCondition ? disabledCondition(formValues) : false);

            const error = get(errors, path);

            // Enhanced error handling - check if error should be shown
            // Don't show errors for hidden fields
            const showError =
              error &&
              fieldState.isVisible &&
              shouldShowError(path, meta, isSubmitted);

            // Create field component
            let fieldNode: React.ReactNode;
            const componentProps = {
              name: path,
              control,
              ...meta,
              disabled: isDisabled,
              error: showError ? error : undefined,
            };

            if (meta?.component && uiAdapter.renderCustomComponent) {
              fieldNode = uiAdapter.renderCustomComponent(
                meta.component,
                componentProps
              );
            } else {
              const componentType = getComponentTypeFromZodType(zodType, meta);
              fieldNode = uiAdapter.renderField(componentType, componentProps);
            }

            // Apply layout renderer if available
            const layoutRenderer =
              formRenderFieldLayout ?? uiAdapter.renderFieldLayout;

            let renderedField: React.ReactNode;
            if (layoutRenderer) {
              renderedField = layoutRenderer({
                children: fieldNode,
                label: meta?.label || '',
                error: showError ? error : undefined,
                helperText: meta?.helperText,
                meta,
                errorState: errorState[path] || {
                  hasError: false,
                  isDirty: false,
                  isTouched: false,
                  isValidating: false,
                },
              });
            } else {
              renderedField = fieldNode;
            }

            // Wrap field in ConditionalField component for transition handling
            return (
              <ConditionalField
                key={path}
                fieldPath={path}
                isVisible={fieldState.isVisible}
                transitionState={fieldState.transitionState}
                shouldRender={fieldState.shouldRender}
                onTransitionEnd={() => {
                  // Handle transition completion if needed
                }}
              >
                {renderedField}
              </ConditionalField>
            );
          })}
        </>
      );
    };

    const UncontrolledForm = () => {
      const {
        control,
        handleSubmit,
        watch,
        reset,
        setValue,
        getValues,
        trigger,
        setError,
        clearErrors,
        formState,
        formState: { errors, isSubmitted },
      } = useForm<any>({
        resolver: zodResolver(schema as any) as any,
        ...(defaultValues && { defaultValues }),
        mode,
      });

      const formValues = watch();

      // Handle validateOnMount
      React.useEffect(() => {
        if (validateOnMount) {
          trigger();
        }
      }, [trigger, validateOnMount]);

      // Expose enhanced form methods via ref
      useImperativeHandle(ref, () => ({
        // Form control methods
        reset: (values?: DeepPartial<z.output<T>>) => {
          reset(values);
          clearErrors();
        },
        clear: () => {
          reset({});
          clearErrors();
        },

        // Validation methods
        validate: async () => {
          const result = await trigger();
          return result;
        },
        validateField: async (fieldName: string) => {
          const result = await trigger(fieldName);
          return result;
        },

        // Form state access
        getValues: () => getValues() as z.output<T>,
        getValue: (fieldName: string) => getValues(fieldName),
        setValue: (fieldName: string, value: any) => setValue(fieldName, value),
        setValues: (values: Partial<z.output<T>>) => {
          Object.entries(values).forEach(([key, value]) => {
            setValue(key, value);
          });
        },

        // Form state queries
        isDirty: () => formState.isDirty,
        isValid: () => formState.isValid,
        isSubmitting: () => formState.isSubmitting,
        isFieldDirty: (fieldName: string) => {
          const fieldState = formState.dirtyFields;
          return get(fieldState, fieldName) || false;
        },
        isFieldTouched: (fieldName: string) => {
          const fieldState = formState.touchedFields;
          return get(fieldState, fieldName) || false;
        },

        // Error management
        setError: (fieldName: string, error: FieldError) =>
          setError(fieldName, error),
        clearError: (fieldName: string) => clearErrors(fieldName),
        clearAllErrors: () => clearErrors(),
        getFieldError: (fieldName: string) => get(errors, fieldName),
        hasErrors: () => Object.keys(errors).length > 0,

        // Form submission
        submit: () => handleSubmit(handleFormSubmit)(),

        // Focus management
        focusField: (fieldName: string) => {
          const element = document.querySelector(
            `[name="${fieldName}"]`
          ) as HTMLElement;
          element?.focus();
        },
        focusFirstErrorField: () => {
          const errorFieldNames = Object.keys(errors);
          if (errorFieldNames.length > 0) {
            const firstErrorField = errorFieldNames[0];
            if (firstErrorField) {
              const element = document.querySelector(
                `[name="${firstErrorField}"]`
              ) as HTMLElement;
              element?.focus();
            }
          }
        },

        // Form state management
        markFieldAsTouched: (fieldName: string) => {
          setValue(fieldName, getValues(fieldName), { shouldTouch: true });
        },
        markAllFieldsAsTouched: () => {
          const allValues = getValues();
          Object.keys(allValues).forEach(fieldName => {
            setValue(fieldName, getValues(fieldName), { shouldTouch: true });
          });
        },
      }));

      // Enhanced error submission handling with hidden field filtering
      const handleFormSubmit = async (data: any) => {
        try {
          // Filter out hidden fields from submission data
          const filteredData = filterHiddenFields(data);
          await onSubmit(filteredData);
          if (resetOnSubmit) {
            reset();
            // Reset conditional field manager state
            conditionalFieldManager.resetAllFields();
          }
        } catch (error) {
          console.error('Form submission error:', error);
          if (onError) {
            onError(errorState);
          }
        }
      };

      const formContent = (
        <>
          <FormFields
            control={control}
            errors={errors}
            formValues={formValues}
            isSubmitted={isSubmitted}
          />
          <button type="submit">Submit</button>
          {errorCount > 0 && errorDisplayOptions?.showErrorsOnSubmit && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Total {errorCount} error(s) found.
            </div>
          )}
        </>
      );

      const formContainer = uiAdapter.renderFormContainer ? (
        uiAdapter.renderFormContainer(formContent, {
          children: formContent,
          onSubmit: handleSubmit(handleFormSubmit),
          'aria-label': formAriaLabel,
          'aria-describedby': formAriaDescribedBy,
        })
      ) : (
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          aria-label={formAriaLabel}
          aria-describedby={formAriaDescribedBy}
        >
          <FormFields
            control={control}
            errors={errors}
            formValues={formValues}
            isSubmitted={isSubmitted}
          />
          <button type="submit">Submit</button>
          {errorCount > 0 && errorDisplayOptions?.showErrorsOnSubmit && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Total {errorCount} error(s) found.
            </div>
          )}
        </form>
      );

      return formContainer;
    };

    const ControlledForm = () => {
      // Get form values and errors from external control
      const formValues =
        externalControl && 'watch' in externalControl
          ? (externalControl as any).watch()
          : {};
      const formErrors =
        externalControl && 'formState' in externalControl
          ? (externalControl as any).formState.errors || {}
          : {};
      const isSubmitted =
        externalControl && 'formState' in externalControl
          ? (externalControl as any).formState.isSubmitted || false
          : false;

      // Enhanced ref functionality for controlled mode
      useImperativeHandle(ref, () => ({
        // Form control methods
        reset: (values?: DeepPartial<z.output<T>>) => {
          if (externalControl && 'reset' in externalControl) {
            (externalControl as any).reset(values || defaultValues);
          } else {
            console.warn(
              'Reset not available - external control does not support reset'
            );
          }
        },
        clear: () => {
          if (externalControl && 'reset' in externalControl) {
            (externalControl as any).reset({});
          } else {
            console.warn(
              'Clear not available - external control does not support reset'
            );
          }
        },

        // Validation methods
        validate: async () => {
          if (externalControl && 'trigger' in externalControl) {
            return await (externalControl as any).trigger();
          }
          console.warn(
            'Validate not available - external control does not support validation'
          );
          return true;
        },
        validateField: async (fieldName: string) => {
          if (externalControl && 'trigger' in externalControl) {
            return await (externalControl as any).trigger(fieldName);
          }
          console.warn(
            'ValidateField not available - external control does not support validation'
          );
          return true;
        },

        // Form state access
        getValues: () => {
          if (externalControl && 'getValues' in externalControl) {
            return (externalControl as any).getValues() as z.output<T>;
          }
          return formValues as z.output<T>;
        },
        getValue: (fieldName: string) => {
          if (externalControl && 'getValues' in externalControl) {
            return (externalControl as any).getValues(fieldName);
          }
          return get(formValues, fieldName);
        },
        setValue: (fieldName: string, value: any) => {
          if (externalControl && 'setValue' in externalControl) {
            (externalControl as any).setValue(fieldName, value);
          } else {
            console.warn(
              'SetValue not available - external control does not support setValue'
            );
          }
        },
        setValues: (values: Partial<z.output<T>>) => {
          if (externalControl && 'setValue' in externalControl) {
            Object.entries(values).forEach(([key, value]) => {
              (externalControl as any).setValue(key, value);
            });
          } else {
            console.warn(
              'SetValues not available - external control does not support setValue'
            );
          }
        },

        // Form state queries
        isDirty: () => {
          if (externalControl && 'formState' in externalControl) {
            return (externalControl as any).formState.isDirty || false;
          }
          return false;
        },
        isValid: () => {
          if (externalControl && 'formState' in externalControl) {
            return (externalControl as any).formState.isValid || false;
          }
          return true;
        },
        isSubmitting: () => {
          if (externalControl && 'formState' in externalControl) {
            return (externalControl as any).formState.isSubmitting || false;
          }
          return false;
        },
        isFieldDirty: (fieldName: string) => {
          if (externalControl && 'formState' in externalControl) {
            const fieldState = (externalControl as any).formState.dirtyFields;
            return get(fieldState, fieldName) || false;
          }
          return false;
        },
        isFieldTouched: (fieldName: string) => {
          if (externalControl && 'formState' in externalControl) {
            const fieldState = (externalControl as any).formState.touchedFields;
            return get(fieldState, fieldName) || false;
          }
          return false;
        },

        // Error management
        setError: (fieldName: string, error: FieldError) => {
          if (externalControl && 'setError' in externalControl) {
            (externalControl as any).setError(fieldName, error);
          } else {
            console.warn(
              'SetError not available - external control does not support setError'
            );
          }
        },
        clearError: (fieldName: string) => {
          if (externalControl && 'clearErrors' in externalControl) {
            (externalControl as any).clearErrors(fieldName);
          } else {
            console.warn(
              'ClearError not available - external control does not support clearErrors'
            );
          }
        },
        clearAllErrors: () => {
          if (externalControl && 'clearErrors' in externalControl) {
            (externalControl as any).clearErrors();
          } else {
            console.warn(
              'ClearAllErrors not available - external control does not support clearErrors'
            );
          }
        },
        getFieldError: (fieldName: string) => get(formErrors, fieldName),
        hasErrors: () => Object.keys(formErrors).length > 0,

        // Form submission
        submit: () => {
          if (externalControl && 'handleSubmit' in externalControl) {
            const handleSubmit = (externalControl as any).handleSubmit;
            handleSubmit(onSubmit)();
          } else {
            console.warn(
              'Submit not available - external control does not support handleSubmit'
            );
          }
        },

        // Focus management
        focusField: (fieldName: string) => {
          const element = document.querySelector(
            `[name="${fieldName}"]`
          ) as HTMLElement;
          element?.focus();
        },
        focusFirstErrorField: () => {
          const errorFieldNames = Object.keys(formErrors);
          if (errorFieldNames.length > 0) {
            const firstErrorField = errorFieldNames[0];
            if (firstErrorField) {
              const element = document.querySelector(
                `[name="${firstErrorField}"]`
              ) as HTMLElement;
              element?.focus();
            }
          }
        },

        // Form state management
        markFieldAsTouched: (fieldName: string) => {
          if (
            externalControl &&
            'setValue' in externalControl &&
            'getValues' in externalControl
          ) {
            const currentValue = (externalControl as any).getValues(fieldName);
            (externalControl as any).setValue(fieldName, currentValue, {
              shouldTouch: true,
            });
          } else {
            console.warn(
              'MarkFieldAsTouched not available - external control does not support setValue/getValues'
            );
          }
        },
        markAllFieldsAsTouched: () => {
          if (
            externalControl &&
            'setValue' in externalControl &&
            'getValues' in externalControl
          ) {
            const allValues = (externalControl as any).getValues();
            Object.keys(allValues).forEach(fieldName => {
              (externalControl as any).setValue(
                fieldName,
                allValues[fieldName],
                { shouldTouch: true }
              );
            });
          } else {
            console.warn(
              'MarkAllFieldsAsTouched not available - external control does not support setValue/getValues'
            );
          }
        },
      }));

      // Enhanced controlled form submission handler with hidden field filtering
      const handleControlledSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (externalControl && 'handleSubmit' in externalControl) {
          const handleSubmit = (externalControl as any).handleSubmit;
          handleSubmit(async (data: any) => {
            try {
              // Filter out hidden fields from submission data
              const filteredData = filterHiddenFields(data);
              await onSubmit(filteredData);
              if (resetOnSubmit && 'reset' in externalControl) {
                (externalControl as any).reset();
                // Reset conditional field manager state
                conditionalFieldManager.resetAllFields();
              }
            } catch (error) {
              console.error('Controlled form submission error:', error);
              if (onError) {
                onError(errorState);
              }
            }
          })();
        } else {
          // Fallback for basic controlled mode
          try {
            // Filter out hidden fields from submission data
            const filteredData = filterHiddenFields(formValues);
            onSubmit(filteredData);
          } catch (error) {
            console.error('Controlled form submission error:', error);
            if (onError) {
              onError(errorState);
            }
          }
        }
      };

      const controlledFormContent = (
        <>
          <FormFields
            control={externalControl!}
            errors={formErrors}
            formValues={formValues}
            isSubmitted={isSubmitted}
          />
          <button type="submit">Submit</button>
          {errorCount > 0 && errorDisplayOptions?.showErrorsOnSubmit && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Total {errorCount} error(s) found.
            </div>
          )}
        </>
      );

      const formContainer = uiAdapter.renderFormContainer ? (
        uiAdapter.renderFormContainer(controlledFormContent, {
          children: controlledFormContent,
          onSubmit: handleControlledSubmit,
          'aria-label': formAriaLabel,
          'aria-describedby': formAriaDescribedBy,
        })
      ) : (
        <form
          onSubmit={handleControlledSubmit}
          aria-label={formAriaLabel}
          aria-describedby={formAriaDescribedBy}
        >
          {controlledFormContent}
        </form>
      );

      return formContainer;
    };

    return isControlled ? <ControlledForm /> : <UncontrolledForm />;
  }
);

// Export the component with proper typing
export type { SchemaFormProps, SchemaFormRef };
