import { zodResolver } from '@hookform/resolvers/zod';
import type React from 'react';
import type { Control, DeepPartial, FieldError } from 'react-hook-form';
import { get, useForm } from 'react-hook-form';
import type { ZodType, z } from 'zod';
import type { UIAdapter } from '../adapters/types';
import {
  extractFieldsFromSchema,
  getComponentTypeFromZodType,
} from '../utils/schema';

export interface SchemaFormProps<T extends ZodType<any, any>> {
  schema: T;
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  uiAdapter: UIAdapter;
  defaultValues?: DeepPartial<z.infer<T>>;
  control?: Control<z.infer<T>>; // For controlled mode
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  renderFieldLayout?: (
    field: React.ReactNode,
    label?: string,
    error?: FieldError,
    name?: string
  ) => React.ReactNode;
}

export function SchemaForm<T extends ZodType<any, any>>({
  schema,
  onSubmit,
  uiAdapter,
  defaultValues,
  control: externalControl,
  mode = 'onSubmit',
  renderFieldLayout: formRenderFieldLayout,
}: SchemaFormProps<T>) {
  const isControlled = !!externalControl;

  const FormFields = ({
    control,
    errors,
    formValues,
  }: {
    control: Control<z.infer<T>>;
    errors: any;
    formValues: any;
  }) => (
    <>
      {extractFieldsFromSchema(schema).map((field: any) => {
        const { path, meta, zodType } = field;

        const displayCondition = meta?.displayCondition;
        if (displayCondition && !displayCondition(formValues)) {
          return null;
        }

        const disabledCondition = meta?.disabledCondition;
        const isDisabled =
          !!meta?.disabled ||
          (disabledCondition ? disabledCondition(formValues) : false);

        const error = get(errors, path);

        let fieldNode: React.ReactNode;
        const componentProps = {
          name: path,
          control,
          ...meta,
          disabled: isDisabled,
          error,
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

        const layoutRenderer =
          formRenderFieldLayout ?? uiAdapter.renderFieldLayout;

        if (layoutRenderer) {
          return layoutRenderer(fieldNode, meta?.label, error, path);
        }
        return fieldNode;
      })}
    </>
  );

  const UncontrolledForm = () => {
    const {
      control,
      handleSubmit,
      watch,
      formState: { errors },
    } = useForm<z.infer<T>>({
      resolver: zodResolver(schema),
      ...(defaultValues && { defaultValues }),
      mode,
    });

    const formValues = watch();

    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormFields control={control} errors={errors} formValues={formValues} />
        <button type="submit">Submit</button>
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
