import type { Control, FieldError, FieldValues, Path, UseFormStateReturn } from 'react-hook-form';
import type { ZodTypeAny } from 'zod';
import type { ValidationMode, CustomErrorMessages } from '../utils/validation';

// 스키마의 meta 정보를 위한 타입
export interface FieldMetadata<TFieldValues extends FieldValues = FieldValues> {
  label?: string;
  placeholder?: string;
  componentType?: string;
  // 필드별로 추가적인 메타데이터를 허용
  [key: string]: any;
}

// UI 어댑터의 각 필드 컴포넌트가 받을 props
export interface FieldProps<TFieldValues extends FieldValues = FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> {
  field: {
    name: TName;
    value: TFieldValues[TName];
    onChange: (...event: any[]) => void;
    onBlur: () => void;
    ref: React.Ref<any>;
  };
  formState: UseFormStateReturn<TFieldValues>;
  error?: FieldError;
  // 스키마에서 추출된 메타데이터
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

// UI 라이브러리와의 연동을 위한 어댑터 인터페이스
export interface UIAdapter {
  [componentType: string]: React.ComponentType<FieldProps<any>>;
}

// SchemaForm 컴포넌트의 props
export interface SchemaFormProps<TFieldValues extends FieldValues> {
  schema: ZodTypeAny;
  uiAdapter: UIAdapter;
  onSubmit: (data: TFieldValues) => void;
  control?: Control<TFieldValues>;
  renderFieldLayout?: (
    fieldComponent: React.ReactNode,
    metadata: FieldMetadata<TFieldValues> & { name: Path<TFieldValues> }
  ) => React.ReactNode;
  className?: string;
  // Validation configuration
  validationMode?: ValidationMode;
  customErrorMessages?: CustomErrorMessages;
  // Additional form configuration
  defaultValues?: Partial<TFieldValues>;
  shouldFocusError?: boolean;
  delayError?: number;
  criteriaMode?: 'firstError' | 'all';
  // Async validation
  asyncValidators?: Record<string, (value: any) => Promise<boolean | string>>;
}
