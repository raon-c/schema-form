'use client';

import {
  Box,
  Container,
  CssBaseline,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { DefaultUIAdapter, MUIAdapter, SchemaForm } from '@schemaform/core';
import { useState } from 'react';
import { z } from 'zod/v4';
import { ControlledFormExample } from './components/ControlledFormExample';
import { FieldTypesExample } from './components/FieldTypesExample';
import styles from './page.module.css';

// Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

// Basic user schema
const userSchema = z.object({
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
  subscribe: z.boolean().optional().meta({
    label: 'Subscribe to newsletter',
    componentType: 'switch',
  }),
});

// Advanced schema with conditional fields
const advancedSchema = z.object({
  userType: z.enum(['individual', 'business']).meta({
    label: 'User Type',
    componentType: 'select',
    options: [
      { value: 'individual', label: 'Individual' },
      { value: 'business', label: 'Business' },
    ],
  }),
  name: z.string().min(2).meta({
    label: 'Full Name',
    placeholder: 'Enter your name',
  }),
  companyName: z
    .string()
    .optional()
    .meta({
      label: 'Company Name',
      placeholder: 'Enter company name',
      displayCondition: (values: any) => values.userType === 'business',
    }),
  password: z.string().min(8, 'Password must be at least 8 characters').meta({
    label: 'Password',
    componentType: 'password',
  }),
  bio: z.string().optional().meta({
    label: 'Bio',
    componentType: 'textarea',
    placeholder: 'Tell us about yourself...',
  }),
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Home() {
  const [tabValue, setTabValue] = useState(0);
  const [basicFormData, setBasicFormData] = useState<any>(null);
  const [advancedFormData, setAdvancedFormData] = useState<any>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBasicSubmit = (data: z.infer<typeof userSchema>) => {
    console.log('Basic form submitted:', data);
    setBasicFormData(data);
  };

  const handleAdvancedSubmit = (data: z.infer<typeof advancedSchema>) => {
    console.log('Advanced form submitted:', data);
    setAdvancedFormData(data);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={styles.page}>
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
              SchemaForm Examples
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              align="center"
              paragraph
            >
              Type-safe form generation from Zod schemas with multiple UI
              adapters
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="schema form examples"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Basic Example" />
                <Tab label="MUI Adapter" />
                <Tab label="Default Adapter" />
                <Tab label="Advanced Features" />
                <Tab label="Controlled Mode" />
                <Tab label="Field Types" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Basic SchemaForm with MUI
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  A simple user registration form using Zod schema and MUI
                  components.
                </Typography>

                <SchemaForm
                  schema={userSchema}
                  uiAdapter={MUIAdapter}
                  onSubmit={handleBasicSubmit}
                  defaultValues={{ subscribe: false }}
                />

                {basicFormData && (
                  <Box
                    sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}
                  >
                    <Typography variant="h6">Form Data:</Typography>
                    <pre>{JSON.stringify(basicFormData, null, 2)}</pre>
                  </Box>
                )}
              </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                  MUI Adapter Example
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Using Material-UI components for a polished, professional
                  look.
                </Typography>

                <SchemaForm
                  schema={userSchema}
                  uiAdapter={MUIAdapter}
                  onSubmit={data => console.log('MUI form:', data)}
                  mode="onChange"
                />
              </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Default Adapter Example
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Using standard HTML elements without any UI library
                  dependencies.
                </Typography>

                <SchemaForm
                  schema={userSchema}
                  uiAdapter={DefaultUIAdapter}
                  onSubmit={data => console.log('Default form:', data)}
                />
              </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Advanced Features
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Conditional fields, different validation modes, and custom
                  components.
                </Typography>

                <SchemaForm
                  schema={advancedSchema}
                  uiAdapter={MUIAdapter}
                  onSubmit={handleAdvancedSubmit}
                  mode="onBlur"
                />

                {advancedFormData && (
                  <Box
                    sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}
                  >
                    <Typography variant="h6">Form Data:</Typography>
                    <pre>{JSON.stringify(advancedFormData, null, 2)}</pre>
                  </Box>
                )}
              </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <Paper elevation={3} sx={{ p: 4 }}>
                <ControlledFormExample />
              </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={5}>
              <Paper elevation={3} sx={{ p: 4 }}>
                <FieldTypesExample />
              </Paper>
            </TabPanel>
          </Box>
        </Container>
      </div>
    </ThemeProvider>
  );
}
