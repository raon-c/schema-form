import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import type { Control, DeepPartial, FieldError } from 'react-hook-form';
import { get, useForm } from 'react-hook-form';
import type { z } from 'zod/v4';
import type { $ZodType } from 'zod/v4/core';
import type { UIAdapter } from '../adapters/types';
import { useErrorHandling } from '../hooks/useErrorHandling';
import type { ErrorDisplayOptions, ErrorMessages } from '../types';
import {
  extractFieldsFromSchema,
  getComponentTypeFromZodType,
} from '../utils/schema';

export interface SchemaFormProps<T extends $ZodType> {
  schema: T;
  onSubmit: (data: z.output<T>) => void | Promise<void>;
  uiAdapter: UIAdapter;
  defaultValues?: DeepPartial<z.output<T>>;
  control?: Control<
    z.output<T> extends Record<string, any> ? z.output<T> : any
  >; // For controlled mode
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  renderFieldLayout?: (
    field: React.ReactNode,
    label?: string,
    error?: FieldError,
    name?: string
  ) => React.ReactNode;
  // Enhanced error handling props
  errorMessages?: ErrorMessages;
  errorDisplayOptions?: ErrorDisplayOptions;
  onError?: (errors: any) => void;
  validateOnMount?: boolean;
}

export function SchemaForm<T extends $ZodType>({
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
}: SchemaFormProps<T>) {
  const isControlled = !!externalControl;

  // Enhanced error handling
  const {
    errors: errorState,
    setFieldError,
    clearFieldError,
    shouldShowError,
    formatErrorMessage,
    errorCount,
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
                return layoutRenderer(fieldNode, meta?.label, error, path);
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
      formState: { errors, isSubmitted },
    } = useForm<any>({
      resolver: zodResolver(schema as any) as any,
      ...(defaultValues && { defaultValues }),
      mode,
    });

    const formValues = watch();

    // Enhanced error submission handling
    const handleFormSubmit = (data: any) => {
      try {
        return onSubmit(data);
      } catch (error) {
        console.error('Form submission error:', error);
        // Could integrate with error handling here
      }
    };

    return (
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <FormFields
          control={control}
          errors={errors}
          formValues={formValues}
          isSubmitted={isSubmitted}
        />
        <button type="submit">Submit</button>
        {errorCount > 0 && errorDisplayOptions?.showErrorsOnSubmit && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            총 {errorCount}개의 오류가 있습니다.
          </div>
        )}
      </form>
    );
  };

  const ControlledForm = () => {
    // In a true controlled component, conditional rendering would also rely on parent state.
    return (
      <form onSubmit={e => e.preventDefault()}>
        <FormFields control={externalControl!} errors={{}} formValues={{}} />
      </form>
    );
  };

  return isControlled ? <ControlledForm /> : <UncontrolledForm />;
}
