import { zodResolver } from '@hookform/resolvers/zod';
import React, { forwardRef, useImperativeHandle } from 'react';
import type { Control, DeepPartial, FieldError } from 'react-hook-form';
import { get, useForm } from 'react-hook-form';
import type { z } from 'zod/v4';
import type { $ZodType } from 'zod/v4/core';
import { useErrorHandling } from '../hooks/useErrorHandling';
import type { SchemaFormProps, SchemaFormRef } from '../types';
import {
  extractFieldsFromSchema,
  getComponentTypeFromZodType,
} from '../utils/schema';

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
    const isControlled = !!externalControl;

    // Enhanced error handling with ErrorManager
    const {
      errors: errorState,
      setFieldError,
      clearFieldError,
      shouldShowError,
      formatErrorMessage,
      errorCount,
      setFieldTouched,
      setFieldDirty,
      setFieldValidating,
      getFieldErrorState,
      isAnyFieldValidating,
      getErrorSummary,
    } = useErrorHandling({
      ...(errorMessages && { errorMessages }),
      ...(errorDisplayOptions && { errorDisplayOptions }),
      ...(onError && { onError }),
    });

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
    }) => (
      <>
        {extractFieldsFromSchema(schema).map((field: any) => {
          const { path, meta, zodType } = field;

          return (
            <React.Fragment key={path}>
              {(() => {
                const displayCondition = meta?.displayCondition;
                if (displayCondition && !displayCondition(formValues)) {
                  return null;
                }

                const disabledCondition = meta?.disabledCondition;
                const isDisabled =
                  !!meta?.disabled ||
                  (disabledCondition ? disabledCondition(formValues) : false);

                const error = get(errors, path);

                // Enhanced error handling - check if error should be shown
                const showError =
                  error && shouldShowError(path, meta, isSubmitted);

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
                  const componentType = getComponentTypeFromZodType(
                    zodType,
                    meta
                  );
                  fieldNode = uiAdapter.renderField(
                    componentType,
                    componentProps
                  );
                }

                const layoutRenderer =
                  formRenderFieldLayout ?? uiAdapter.renderFieldLayout;

                if (layoutRenderer) {
                  return layoutRenderer({
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
                }
                return fieldNode;
              })()}
            </React.Fragment>
          );
        })}
      </>
    );

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
        formState: { errors, isSubmitted },
      } = useForm<any>({
        resolver: zodResolver(schema as any) as any,
        ...(defaultValues && { defaultValues }),
        mode,
      });

      const formValues = watch();

      // Expose form methods via ref
      useImperativeHandle(ref, () => ({
        reset: (values?: DeepPartial<z.output<T>>) => {
          reset(values);
          clearErrors();
        },
        clear: () => {
          reset({});
          clearErrors();
        },
        validate: async () => {
          const result = await trigger();
          return result;
        },
        validateField: async (fieldName: string) => {
          const result = await trigger(fieldName);
          return result;
        },
        getValues: () => getValues() as z.output<T>,
        getValue: (fieldName: string) => getValues(fieldName),
        setValue: (fieldName: string, value: any) => setValue(fieldName, value),
        setError: (fieldName: string, error: FieldError) =>
          setError(fieldName, error),
        clearError: (fieldName: string) => clearErrors(fieldName),
        clearAllErrors: () => clearErrors(),
        submit: () => handleSubmit(handleFormSubmit)(),
        focusField: (fieldName: string) => {
          const element = document.querySelector(
            `[name="${fieldName}"]`
          ) as HTMLElement;
          element?.focus();
        },
      }));

      // Enhanced error submission handling
      const handleFormSubmit = async (data: any) => {
        try {
          await onSubmit(data);
          if (resetOnSubmit) {
            reset();
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
      // For controlled mode, expose limited ref functionality
      useImperativeHandle(ref, () => ({
        reset: () => console.warn('Reset not available in controlled mode'),
        clear: () => console.warn('Clear not available in controlled mode'),
        validate: async () => true,
        validateField: async () => true,
        getValues: () => ({}) as z.output<T>,
        getValue: () => undefined,
        setValue: () =>
          console.warn('setValue not available in controlled mode'),
        setError: () =>
          console.warn('setError not available in controlled mode'),
        clearError: () =>
          console.warn('clearError not available in controlled mode'),
        clearAllErrors: () =>
          console.warn('clearAllErrors not available in controlled mode'),
        submit: () => console.warn('submit not available in controlled mode'),
        focusField: (fieldName: string) => {
          const element = document.querySelector(
            `[name="${fieldName}"]`
          ) as HTMLElement;
          element?.focus();
        },
      }));

      const controlledFormContent = (
        <FormFields control={externalControl!} errors={{}} formValues={{}} />
      );

      const formContainer = uiAdapter.renderFormContainer ? (
        uiAdapter.renderFormContainer(controlledFormContent, {
          children: controlledFormContent,
          onSubmit: e => e.preventDefault(),
          'aria-label': formAriaLabel,
          'aria-describedby': formAriaDescribedBy,
        })
      ) : (
        <form
          onSubmit={e => e.preventDefault()}
          aria-label={formAriaLabel}
          aria-describedby={formAriaDescribedBy}
        >
          <FormFields control={externalControl!} errors={{}} formValues={{}} />
        </form>
      );

      return formContainer;
    };

    return isControlled ? <ControlledForm /> : <UncontrolledForm />;
  }
);

// Export the component with proper typing
export type { SchemaFormProps, SchemaFormRef };
