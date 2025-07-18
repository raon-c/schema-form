import React from 'react';
import type { UIAdapter, FieldProps, LayoutInfo } from '../types/index.js';

// AIDEV-NOTE: 필드 컴포넌트들은 이제 순수하게 입력 요소만 렌더링하고,
// 레이아웃(레이블, 에러 메시지 등)은 renderFieldLayout에서 처리합니다.

const StringInput: React.FC<FieldProps> = ({ field, placeholder, disabled }) => (
  <input 
    id={field.name} 
    {...field} 
    placeholder={placeholder}
    disabled={disabled}
  />
);

const PasswordInput: React.FC<FieldProps> = ({ field, placeholder, disabled }) => (
  <input 
    id={field.name} 
    type="password" 
    {...field} 
    placeholder={placeholder}
    disabled={disabled}
  />
);

const NumberInput: React.FC<FieldProps> = ({ field, placeholder, disabled, formState }) => (
  <input 
    id={field.name} 
    type="number" 
    {...field} 
    placeholder={placeholder}
    disabled={disabled || formState.isSubmitting}
    onChange={(e) => {
      const value = e.target.value;
      field.onChange(value ? parseFloat(value) : '');
    }}
  />
);

const BooleanCheckbox: React.FC<FieldProps> = ({ field, disabled, formState }) => (
  <input
    id={field.name}
    type="checkbox"
    {...field}
    checked={!!field.value}
    disabled={disabled || formState.isSubmitting}
  />
);

const DateInput: React.FC<FieldProps> = ({ field, disabled, formState }) => (
  <input 
    id={field.name} 
    type="date" 
    {...field} 
    disabled={disabled || formState.isSubmitting}
  />
);

const EmailInput: React.FC<FieldProps> = ({ field, placeholder, disabled, formState }) => (
  <input 
    id={field.name} 
    type="email" 
    {...field} 
    placeholder={placeholder}
    disabled={disabled || formState.isSubmitting}
  />
);

const renderDefaultFieldLayout = (
  fieldComponent: React.ReactNode,
  layoutInfo: LayoutInfo
) => {
  const { label, name, required, formState } = layoutInfo;
  const error = formState.errors[name];

  return (
    <div className="sf-field-container">
      {label && (
        <label htmlFor={name} className="sf-field-label">
          {label}
          {required && <span className="sf-required-indicator">*</span>}
        </label>
      )}
      <div className="sf-field-input-container">
        {fieldComponent}
      </div>
      {error?.message && (
        <div className="sf-field-error">
          {error.message as string}
        </div>
      )}
    </div>
  );
};

export const defaultAdapter: UIAdapter = {
  string: StringInput,
  password: PasswordInput,
  number: NumberInput,
  boolean: BooleanCheckbox,
  date: DateInput,
  email: EmailInput,
  renderFieldLayout: renderDefaultFieldLayout,
};
