import { useForm, Controller, FieldValues, Path, useWatch, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodObject, ZodTypeAny } from 'zod';
import type { SchemaFormProps, FieldMetadata, LayoutInfo } from '../types/index.js';
import { extractFieldsFromSchema, getComponentType } from '../utils/schema.js';
import { 
  createSchemaWithCustomErrors, 
  getValidationModeConfig,
  createAsyncValidator 
} from '../utils/validation.js';
import React from 'react';

export function SchemaForm<TFieldValues extends FieldValues>({ 
  schema, 
  uiAdapter, 
  onSubmit, 
  control: externalControl,
  renderFieldLayout: formRenderFieldLayout,
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
    ? schemaWithCustomErrors.superRefine(async (data: TFieldValues, ctx: any) => {
        const errors = await createAsyncValidator(asyncValidators)(data);
        errors.forEach((error: { path: string[]; message: string }) => {
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

  const formValues = useWatch({ control });

  const fields = extractFieldsFromSchema(schema as ZodObject<any, any>);

  const handleFormSubmit = handleSubmit(onSubmit);

  const renderFieldLayout = formRenderFieldLayout || uiAdapter.renderFieldLayout;

  return (
    <form onSubmit={handleFormSubmit} className={className}>
      {fields.map(({ name, zodType, metadata }: { name: Path<TFieldValues>; zodType: ZodTypeAny; metadata: FieldMetadata<TFieldValues> }) => {
        const shouldDisplay = metadata.displayCondition ? metadata.displayCondition(formValues) : true;
        if (!shouldDisplay) {
          return null;
        }

        // AIDEV-NOTE: 커스텀 컴포넌트를 렌더링하는 로직.
        // metadata에 component가 직접 제공되면 uiAdapter를 무시하고 해당 컴포넌트를 사용합니다.
        const CustomComponent = metadata.component;

        const componentType = getComponentType(zodType, metadata);
        const FieldComponent = CustomComponent || uiAdapter[componentType];

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
          const layoutInfo: LayoutInfo<TFieldValues> = { name: name as Path<TFieldValues>, formState, ...metadata };
          return renderFieldLayout(fieldElement, layoutInfo);
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
