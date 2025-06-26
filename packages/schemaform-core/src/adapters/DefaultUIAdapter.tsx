import React from 'react';
import type { UIAdapter, FieldProps } from '../types';

// 기본 레이아웃 컴포넌트
const FieldWrapper: React.FC<{ 
  children: React.ReactNode; 
  name: string; 
  label: string; 
  error?: { message?: string };
  required?: boolean;
}> = ({ children, name, label, error, required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
    <label htmlFor={name}>
      {label}
      {required && <span style={{ color: 'red' }}> *</span>}
    </label>
    {children}
    {error?.message && (
      <span style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.25rem' }}>
        {error.message}
      </span>
    )}
  </div>
);

// 문자열 입력 필드
const StringInput: React.FC<FieldProps> = ({ 
  field, 
  label, 
  placeholder, 
  error,
  required,
  disabled 
}) => (
  <FieldWrapper name={field.name} label={label} error={error} required={required}>
    <input 
      id={field.name} 
      {...field} 
      placeholder={placeholder}
      disabled={disabled}
      style={{
        padding: '0.5rem',
        borderRadius: '4px',
        border: error ? '1px solid red' : '1px solid #ccc',
      }}
    />
  </FieldWrapper>
);

// 비밀번호 입력 필드
const PasswordInput: React.FC<FieldProps> = ({ 
  field, 
  label, 
  placeholder, 
  error,
  required,
  disabled 
}) => (
  <FieldWrapper name={field.name} label={label} error={error} required={required}>
    <input 
      id={field.name} 
      type="password" 
      {...field} 
      placeholder={placeholder}
      disabled={disabled}
      style={{
        padding: '0.5rem',
        borderRadius: '4px',
        border: error ? '1px solid red' : '1px solid #ccc',
      }}
    />
  </FieldWrapper>
);

// 숫자 입력 필드
const NumberInput: React.FC<FieldProps> = ({ 
  field, 
  label, 
  placeholder, 
  error,
  required,
  disabled,
  formState 
}) => (
  <FieldWrapper name={field.name} label={label} error={error} required={required}>
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
      style={{
        padding: '0.5rem',
        borderRadius: '4px',
        border: error ? '1px solid red' : '1px solid #ccc',
      }}
    />
  </FieldWrapper>
);

// 불리언 (체크박스) 필드
const BooleanCheckbox: React.FC<FieldProps> = ({ 
  field, 
  label, 
  error,
  required,
  disabled,
  formState 
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <input
        id={field.name}
        type="checkbox"
        {...field}
        checked={!!field.value}
        disabled={disabled || formState.isSubmitting}
        style={{ marginRight: '0.5rem' }}
      />
      <label htmlFor={field.name}>
        {label}
        {required && <span style={{ color: 'red' }}> *</span>}
      </label>
    </div>
    {error?.message && (
      <span style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.25rem' }}>
        {error.message}
      </span>
    )}
  </div>
);

// 날짜 입력 필드
const DateInput: React.FC<FieldProps> = ({ 
  field, 
  label, 
  error,
  required,
  disabled,
  formState 
}) => (
  <FieldWrapper name={field.name} label={label} error={error} required={required}>
    <input 
      id={field.name} 
      type="date" 
      {...field} 
      disabled={disabled || formState.isSubmitting}
      style={{
        padding: '0.5rem',
        borderRadius: '4px',
        border: error ? '1px solid red' : '1px solid #ccc',
      }}
    />
  </FieldWrapper>
);

// 이메일 입력 필드
const EmailInput: React.FC<FieldProps> = ({ 
  field, 
  label, 
  placeholder, 
  error,
  required,
  disabled,
  formState 
}) => (
  <FieldWrapper name={field.name} label={label} error={error} required={required}>
    <input 
      id={field.name} 
      type="email" 
      {...field} 
      placeholder={placeholder}
      disabled={disabled || formState.isSubmitting}
      style={{
        padding: '0.5rem',
        borderRadius: '4px',
        border: error ? '1px solid red' : '1px solid #ccc',
      }}
    />
  </FieldWrapper>
);

export const defaultAdapter: UIAdapter = {
  string: StringInput,
  password: PasswordInput,
  number: NumberInput,
  boolean: BooleanCheckbox,
  date: DateInput,
  email: EmailInput,
};
