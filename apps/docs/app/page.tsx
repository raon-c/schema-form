'use client';

import { Brightness4, Brightness7 } from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  Container,
  CssBaseline,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { DefaultUIAdapter, SchemaForm } from '@schemaform/core';
import { MUIAdapter } from '@schemaform/mui-adapter';
import { useState } from 'react';
import { z } from 'zod/v4';
import { ControlledFormExample } from './components/ControlledFormExample';
import { ErrorHandlingExample } from './components/ErrorHandlingExample';
import { FieldTypesExample } from './components/FieldTypesExample';

// 기본 사용자 스키마 (Basic Tab용)
const basicUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').meta({
    label: 'Full Name',
    placeholder: 'Enter your full name',
    helperText: 'Your legal name as it appears on documents',
  }),
  email: z.string().email('Please enter a valid email').meta({
    label: 'Email Address',
    placeholder: 'john@example.com',
    validationTrigger: 'onBlur',
  }),
  age: z
    .number()
    .min(18, 'Must be at least 18')
    .max(120, 'Must be less than 120')
    .meta({
      label: 'Age',
      componentType: 'number',
    }),
  newsletter: z.boolean().optional().meta({
    label: 'Subscribe to newsletter',
    componentType: 'switch',
  }),
});

// 회사 등록 스키마 (MUI Adapter용)
const companySchema = z.object({
  companyName: z.string().min(2, 'Company name is required').meta({
    label: 'Company Name',
    placeholder: 'Your Company Ltd.',
  }),
  industry: z
    .enum(['tech', 'finance', 'healthcare', 'education', 'other'])
    .meta({
      label: 'Industry',
      componentType: 'select',
      options: [
        { value: 'tech', label: 'Technology' },
        { value: 'finance', label: 'Finance' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'education', label: 'Education' },
        { value: 'other', label: 'Other' },
      ],
    }),
  employeeCount: z.number().min(1).max(10000).meta({
    label: 'Number of Employees',
    componentType: 'number',
  }),
  website: z.string().url('Must be a valid URL').optional().meta({
    label: 'Company Website',
    placeholder: 'https://yourcompany.com',
  }),
  description: z.string().max(500).optional().meta({
    label: 'Company Description',
    componentType: 'textarea',
    placeholder: 'Brief description of your company...',
  }),
});

// 간단한 연락처 스키마 (Default Adapter용)
const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').meta({
    label: 'First Name',
    placeholder: 'John',
  }),
  lastName: z.string().min(1, 'Last name is required').meta({
    label: 'Last Name',
    placeholder: 'Doe',
  }),
  phone: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number')
    .meta({
      label: 'Phone Number',
      placeholder: '+1 (555) 123-4567',
    }),
  message: z.string().min(10, 'Message must be at least 10 characters').meta({
    label: 'Message',
    componentType: 'textarea',
    placeholder: 'Your message here...',
  }),
});

// 조건부 필드를 가진 고급 스키마
const conditionalSchema = z.object({
  accountType: z.enum(['personal', 'business']).meta({
    label: 'Account Type',
    componentType: 'select',
    options: [
      { value: 'personal', label: 'Personal Account' },
      { value: 'business', label: 'Business Account' },
    ],
  }),
  email: z.string().email().meta({
    label: 'Email Address',
    placeholder: 'your.email@example.com',
  }),
  personalInfo: z
    .object({
      firstName: z.string().min(1).meta({
        label: 'First Name',
        placeholder: 'John',
      }),
      lastName: z.string().min(1).meta({
        label: 'Last Name',
        placeholder: 'Doe',
      }),
      dateOfBirth: z.string().meta({
        label: 'Date of Birth',
        componentType: 'date',
      }),
    })
    .optional(),
  businessInfo: z
    .object({
      companyName: z.string().min(1).meta({
        label: 'Company Name',
        placeholder: 'Your Company Inc.',
      }),
      taxId: z.string().min(1).meta({
        label: 'Tax ID',
        placeholder: 'XX-XXXXXXX',
      }),
      yearEstablished: z.number().min(1800).max(new Date().getFullYear()).meta({
        label: 'Year Established',
        componentType: 'number',
      }),
    })
    .optional(),
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

export default function Home() {
  const [tabValue, setTabValue] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [submittedData, setSubmittedData] = useState<Record<string, any>>({});

  // 다이나믹 테마 생성
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: darkMode ? '#f48fb1' : '#dc004e',
      },
      background: {
        default: darkMode ? '#121212' : '#fafafa',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '1rem',
            minHeight: 64,
            '&.Mui-selected': {
              fontWeight: 700,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 4,
            borderRadius: '4px 4px 0 0',
          },
        },
      },
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleFormSubmit = (tabIndex: number) => (data: any) => {
    console.log(`Tab ${tabIndex} form submitted:`, data);
    setSubmittedData(prev => ({ ...prev, [tabIndex]: data }));
  };

  const tabsConfig = [
    {
      label: '🚀 Quick Start',
      description: 'Basic form with essential fields',
      badge: 'Beginner',
    },
    {
      label: '🎨 MUI Styled',
      description: 'Professional Material-UI components',
      badge: 'Popular',
    },
    {
      label: '🔧 HTML Native',
      description: 'Plain HTML without UI dependencies',
      badge: 'Lightweight',
    },
    {
      label: '⚡ Advanced',
      description: 'Conditional fields and complex logic',
      badge: 'Pro',
    },
    {
      label: '🎛️ Controlled',
      description: 'External form state management',
      badge: 'Advanced',
    },
    {
      label: '📝 Field Types',
      description: 'All supported input components',
      badge: 'Reference',
    },
    {
      label: '🚨 Error Handling',
      description: 'Enhanced validation and error display',
      badge: 'Enhanced',
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* 헤더 섹션 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 6,
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 3, md: 0 },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
              }}
            >
              SchemaForm
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              paragraph
              sx={{ mb: 3, maxWidth: '600px' }}
            >
              Type-safe form generation from Zod schemas with multiple UI
              adapters. Build forms faster with automatic validation and
              customizable components.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label="🔒 Type Safe" color="primary" variant="outlined" />
              <Chip
                label="⚡ Fast Setup"
                color="secondary"
                variant="outlined"
              />
              <Chip
                label="🎨 Customizable"
                color="primary"
                variant="outlined"
              />
              <Chip
                label="📱 Responsive"
                color="secondary"
                variant="outlined"
              />
            </Stack>
          </Box>

          {/* 테마 토글 */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Tooltip title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
              <IconButton
                onClick={handleThemeToggle}
                color="primary"
                size="large"
              >
                {darkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={handleThemeToggle}
                  color="primary"
                />
              }
              label={
                <Typography variant="caption" fontWeight={600}>
                  {darkMode ? '🌙 Dark' : '☀️ Light'}
                </Typography>
              }
              labelPlacement="bottom"
            />
          </Box>
        </Box>

        {/* 탭 섹션 */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 80,
                '& .MuiTabs-flexContainer': {
                  gap: 1,
                },
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  padding: '16px 24px',
                  minWidth: 160,
                  border: '1px solid transparent',
                  borderRadius: '12px 12px 0 0',
                  margin: '8px 4px 0 4px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderColor: 'primary.main',
                  },
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              {tabsConfig.map((tab, index) => (
                <Tab
                  key={index}
                  label={
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body1" fontWeight={600}>
                          {tab.label}
                        </Typography>
                        <Chip
                          label={tab.badge}
                          size="small"
                          color={index === tabValue ? 'secondary' : 'default'}
                          variant={index === tabValue ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {tab.description}
                      </Typography>
                    </Box>
                  }
                  {...a11yProps(index)}
                />
              ))}
            </Tabs>
          </Box>

          {/* 탭 내용 */}
          <Box sx={{ minHeight: '600px' }}>
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom color="primary">
                  🚀 Quick Start Example
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  가장 기본적인 SchemaForm 사용법입니다. Zod 스키마를 정의하고
                  메타데이터를 추가하여 자동으로 폼을 생성합니다.
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    💡 <strong>Tip:</strong> 스키마의 <code>.meta()</code>{' '}
                    메서드를 사용하여 라벨, 플레이스홀더, 헬퍼 텍스트를 설정할
                    수 있습니다.
                  </Typography>
                </Alert>

                {/* @ts-ignore - React 19 type compatibility issue */}
                <SchemaForm
                  schema={basicUserSchema}
                  uiAdapter={MUIAdapter}
                  onSubmit={handleFormSubmit(0)}
                  defaultValues={{ newsletter: false }}
                  mode="onChange"
                />

                {submittedData[0] && (
                  <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="h6">✅ Form Submitted!</Typography>
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(submittedData[0], null, 2)}
                      </pre>
                    </Box>
                  </Alert>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom color="primary">
                  🎨 Material-UI Styled Form
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Material-UI 컴포넌트를 사용한 전문적인 비즈니스 폼입니다.
                  다양한 필드 타입과 스타일링을 확인해보세요.
                </Typography>

                {/* @ts-ignore - React 19 type compatibility issue */}
                <SchemaForm
                  schema={companySchema}
                  uiAdapter={MUIAdapter}
                  onSubmit={handleFormSubmit(1)}
                  mode="onBlur"
                />

                {submittedData[1] && (
                  <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="h6">🏢 Company Registered!</Typography>
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(submittedData[1], null, 2)}
                      </pre>
                    </Box>
                  </Alert>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom color="primary">
                  🔧 Native HTML Components
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  외부 UI 라이브러리 없이 순수 HTML 요소만을 사용한 가벼운
                  구현입니다. 최소한의 의존성으로 동일한 기능을 제공합니다.
                </Typography>

                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    ⚠️ <strong>Note:</strong> 스타일링이 최소화되어 있습니다.
                    실제 프로젝트에서는 CSS를 추가하여 디자인을 개선하세요.
                  </Typography>
                </Alert>

                <Box
                  sx={{
                    p: 3,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.default',
                  }}
                >
                  {/* @ts-ignore - React 19 type compatibility issue */}
                  <SchemaForm
                    schema={contactSchema}
                    uiAdapter={DefaultUIAdapter}
                    onSubmit={handleFormSubmit(2)}
                  />
                </Box>

                {submittedData[2] && (
                  <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="h6">📞 Contact Info Saved!</Typography>
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(submittedData[2], null, 2)}
                      </pre>
                    </Box>
                  </Alert>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Box sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom color="primary">
                  ⚡ Advanced Conditional Logic
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  조건부 필드와 복잡한 스키마 구조를 보여주는 고급 예제입니다.
                  사용자 선택에 따라 다른 필드가 나타납니다.
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    💡 <strong>Try it:</strong> Account Type을 변경하여 조건부
                    필드가 어떻게 동작하는지 확인해보세요.
                  </Typography>
                </Alert>

                {/* @ts-ignore - React 19 type compatibility issue */}
                <SchemaForm
                  schema={conditionalSchema}
                  uiAdapter={MUIAdapter}
                  onSubmit={handleFormSubmit(3)}
                  mode="onChange"
                />

                {submittedData[3] && (
                  <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="h6">
                      🎯 Advanced Form Completed!
                    </Typography>
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(submittedData[3], null, 2)}
                      </pre>
                    </Box>
                  </Alert>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <ControlledFormExample />
            </TabPanel>

            <TabPanel value={tabValue} index={5}>
              <FieldTypesExample />
            </TabPanel>

            <TabPanel value={tabValue} index={6}>
              <ErrorHandlingExample />
            </TabPanel>
          </Box>
        </Paper>

        {/* 푸터 정보 */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            SchemaForm • Built with ❤️ using React Hook Form + Zod + Material-UI
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
