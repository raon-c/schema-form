'use client';

import {
  Alert,
  Box,
  Divider,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import { MUIAdapter, SchemaForm } from '@schemaform/core';
import { useState } from 'react';
import { z } from 'zod/v4';

// 다양한 검증 규칙을 가진 스키마
const errorDemoSchema = z
  .object({
    // 필수 필드
    username: z.string().min(3, 'Username must be at least 3 characters').meta({
      label: 'Username',
      placeholder: 'Enter username (min 3 chars)',
      helperText: 'This field demonstrates real-time validation',
    }),

    // 이메일 검증
    email: z.string().email('Please enter a valid email address').meta({
      label: 'Email',
      placeholder: 'user@example.com',
    }),

    // 패스워드 복합 검증
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .meta({
        label: 'Password',
        componentType: 'password',
        helperText: 'Must be 8+ chars with uppercase, lowercase, and number',
      }),

    // 패스워드 확인
    confirmPassword: z.string().meta({
      label: 'Confirm Password',
      componentType: 'password',
    }),

    // 나이 범위 검증
    age: z
      .number()
      .min(13, 'Must be at least 13 years old')
      .max(120, 'Age cannot exceed 120')
      .meta({
        label: 'Age',
        componentType: 'number',
        helperText: 'Enter your age (13-120)',
      }),

    // 선택적 필드 (bio) - max를 string에서 먼저 적용
    bio: z
      .string()
      .max(500, 'Bio cannot exceed 500 characters')
      .optional()
      .meta({
        label: 'Bio (Optional)',
        componentType: 'textarea',
        placeholder: 'Tell us about yourself... (max 500 characters)',
      }),

    // 약관 동의 (필수)
    agreeToTerms: z
      .boolean()
      .refine(val => val === true, {
        message: 'You must agree to the terms and conditions',
      })
      .meta({
        label: 'I agree to the terms and conditions',
        componentType: 'checkbox',
      }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ErrorDemoData = z.infer<typeof errorDemoSchema>;

export function ErrorHandlingExample() {
  const [submittedData, setSubmittedData] = useState<ErrorDemoData | null>(
    null
  );
  const [errorDisplayMode, setErrorDisplayMode] = useState({
    showOnTouch: true,
    showOnSubmit: true,
    showOnBlur: false,
  });

  const handleSubmit = (data: ErrorDemoData) => {
    console.log('Form submitted with enhanced error handling:', data);
    setSubmittedData(data);
  };

  const handleErrorsChange = (errors: any) => {
    console.log('Form errors changed:', errors);
  };

  // 커스텀 에러 메시지 (현재는 표시용, 실제 동작하지 않음)
  const customErrorMessages = {
    required: (fieldName: string) => `🔸 ${fieldName}을(를) 입력해주세요`,
    invalid: (fieldName: string) =>
      `❌ ${fieldName}의 형식이 올바르지 않습니다`,
    tooShort: (fieldName: string, min: number) =>
      `📏 ${fieldName}은(는) 최소 ${min}자 이상이어야 합니다`,
    tooLong: (fieldName: string, max: number) =>
      `📏 ${fieldName}은(는) 최대 ${max}자 이하여야 합니다`,
    email: () => `📧 올바른 이메일 주소를 입력해주세요`,
    pattern: (fieldName: string) =>
      `🔍 ${fieldName}의 형식이 올바르지 않습니다`,
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        🚨 Enhanced Error Handling Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        이 예제는 SchemaForm의 강화된 에러 처리 기능을 보여줍니다. 실시간 검증,
        커스텀 에러 메시지, 다양한 에러 표시 조건 등을 확인할 수 있습니다.
        <br />
        <em>(일부 고급 기능은 향후 구현 예정)</em>
      </Typography>

      {/* 에러 표시 설정 */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          🔧 Error Display Settings (Demo UI)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Switch
                checked={errorDisplayMode.showOnTouch}
                onChange={e =>
                  setErrorDisplayMode(prev => ({
                    ...prev,
                    showOnTouch: e.target.checked,
                  }))
                }
              />
            }
            label="Show errors on touch"
          />
          <FormControlLabel
            control={
              <Switch
                checked={errorDisplayMode.showOnSubmit}
                onChange={e =>
                  setErrorDisplayMode(prev => ({
                    ...prev,
                    showOnSubmit: e.target.checked,
                  }))
                }
              />
            }
            label="Show errors on submit"
          />
          <FormControlLabel
            control={
              <Switch
                checked={errorDisplayMode.showOnBlur}
                onChange={e =>
                  setErrorDisplayMode(prev => ({
                    ...prev,
                    showOnBlur: e.target.checked,
                  }))
                }
              />
            }
            label="Show errors on blur"
          />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* 현재 사용 가능한 기본 에러 처리를 사용하는 폼 */}
      <SchemaForm
        schema={errorDemoSchema}
        uiAdapter={MUIAdapter}
        onSubmit={handleSubmit}
        mode="onChange"
        defaultValues={{
          agreeToTerms: false,
        }}
      />

      {/* 제출된 데이터 표시 */}
      {submittedData && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="h6">✅ Form Submitted Successfully!</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            All validations passed! Check the console for detailed data.
          </Typography>
          <Box
            sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}
          >
            <pre
              style={{ fontSize: '0.75rem', margin: 0, whiteSpace: 'pre-wrap' }}
            >
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </Box>
        </Alert>
      )}

      {/* 기능 설명 */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          borderRadius: 1,
        }}
      >
        <Typography variant="h6" gutterBottom>
          🌟 Current Error Handling Features
        </Typography>
        <Typography variant="body2" component="div">
          <strong>✅ Zod Schema Validation:</strong> Full integration with Zod
          v4 validation rules
          <br />
          <strong>✅ Real-time Validation:</strong> onChange mode shows errors
          as you type
          <br />
          <strong>✅ MUI Error Display:</strong> Beautiful error messages in
          Material-UI format
          <br />
          <strong>✅ Cross-field Validation:</strong> Password confirmation
          using Zod refine
          <br />
          <strong>✅ Complex Validation Rules:</strong> Regex patterns, length
          limits, number ranges
          <br />
          <strong>🚧 Custom Error Messages:</strong> Enhanced system implemented
          (in progress)
          <br />
          <strong>🚧 Conditional Error Display:</strong> Advanced error
          triggering (planned)
        </Typography>
      </Box>

      {/* 테스트 시나리오 */}
      <Box
        sx={{
          mt: 3,
          p: 3,
          bgcolor: 'warning.light',
          color: 'warning.contrastText',
          borderRadius: 1,
        }}
      >
        <Typography variant="h6" gutterBottom>
          🧪 Try These Test Scenarios
        </Typography>
        <Typography variant="body2" component="div">
          <strong>1.</strong> Enter a username with less than 3 characters
          <br />
          <strong>2.</strong> Type an invalid email format
          <br />
          <strong>3.</strong> Create a password that doesn't meet all
          requirements
          <br />
          <strong>4.</strong> Enter different passwords in password fields
          <br />
          <strong>5.</strong> Try to submit without agreeing to terms
          <br />
          <strong>6.</strong> Enter text longer than 500 characters in bio field
        </Typography>
      </Box>
    </Box>
  );
}
