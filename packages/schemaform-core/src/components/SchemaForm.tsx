import * as React from 'react';
import { useForm, Controller, FieldValues, FieldPath, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodObject } from 'zod';
import type { SchemaFormProps } from '../types';
import { extractFieldsFromSchema, getComponentType } from '../utils/schema';
import { 
  createSchemaWithCustomErrors, 
  getValidationModeConfig,
  createAsyncValidator 
} from '../utils/validation';

export function SchemaForm<TFieldValues extends FieldValues>({ 
  schema, 
  uiAdapter, 
  onSubmit, 
  control: externalControl,
  renderFieldLayout,
  className,
  validationMode = 'onChange',
  customErrorMessages,
  defaultValues,
  shouldFocusError = true,
  delayError,
  criteriaMode = 'firstError',
  asyncValidators,
}: SchemaFormProps<TFieldValues>) {
  // Apply custom error messages if provided
  const schemaWithCustomErrors = customErrorMessages 
    ? createSchemaWithCustomErrors(schema, customErrorMessages)
    : schema;

  // Apply async validators if provided
  const finalSchema = asyncValidators
    ? schemaWithCustomErrors.superRefine(async (data, ctx) => {
        const errors = await createAsyncValidator(asyncValidators)(data);
        errors.forEach(error => {
          ctx.addIssue({
            code: 'custom',
            path: error.path,
            message: error.message,
          });
        });
      })
    : schemaWithCustomErrors;

  const validationModeConfig = getValidationModeConfig(validationMode);

  const { 
    control: internalControl, 
    handleSubmit, 
    formState,
  } = useForm<TFieldValues>({
    resolver: zodResolver(finalSchema),
    defaultValues: defaultValues as any,
    shouldFocusError,
    delayError,
    criteriaMode,
    ...validationModeConfig,
  });

  const control = externalControl || internalControl;

  const fields = extractFieldsFromSchema(schema as ZodObject<any, any>);

  const handleFormSubmit = handleSubmit(onSubmit);

  return (
    <form onSubmit={handleFormSubmit} className={className}>
      {fields.map(({ name, zodType, metadata }) => {
        const componentType = getComponentType(zodType, metadata);
        const FieldComponent = uiAdapter[componentType];

        if (!FieldComponent) {
          console.warn(`SchemaForm: No component found in UI adapter for componentType "${componentType}"`);
          return (
            <div key={name}>
              Unsupported field type: {componentType}
            </div>
          );
        }

        const fieldElement = (
          <Controller
            key={name}
            name={name as Path<TFieldValues>}
            control={control}
            render={({ field, fieldState }) => (
              <FieldComponent
                field={field}
                formState={formState}
                error={fieldState.error}
                label={metadata.label || name}
                placeholder={metadata.placeholder}
                required={!zodType._def.description?.includes('optional')}
                {...metadata} // Pass all metadata to the component
              />
            )}
          />
        );

        if (renderFieldLayout) {
          return renderFieldLayout(fieldElement, { name: name as Path<TFieldValues>, ...metadata });
        }

        return fieldElement;
      })}

      {!externalControl && (
        <button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      )}
    </form>
  );
}
