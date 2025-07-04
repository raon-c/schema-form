'use client';

import { Box, Divider, Typography } from '@mui/material';
import { MUIAdapter, SchemaForm } from '@schemaform/core';
import { z } from 'zod/v4';

// Comprehensive schema demonstrating all field types
const fieldTypesSchema = z.object({
  // Text inputs
  basicText: z.string().min(1, 'Required').meta({
    label: 'Basic Text Input',
    placeholder: 'Enter some text',
  }),

  passwordField: z.string().min(8, 'Minimum 8 characters').meta({
    label: 'Password',
    componentType: 'password',
    helperText: 'Must be at least 8 characters',
  }),

  emailField: z.string().email('Invalid email').meta({
    label: 'Email Address',
    placeholder: 'user@example.com',
    validationTrigger: 'onBlur',
  }),

  textareaField: z.string().optional().meta({
    label: 'Long Text (Textarea)',
    componentType: 'textarea',
    placeholder: 'Enter multiple lines of text...',
  }),

  // Number inputs
  numberField: z.number().min(0).max(100).meta({
    label: 'Number (0-100)',
    componentType: 'number',
  }),

  ageField: z.number().int().min(18).max(120).meta({
    label: 'Age',
    componentType: 'number',
    helperText: 'Must be between 18 and 120',
  }),

  // Boolean inputs
  switchField: z.boolean().meta({
    label: 'Toggle Switch',
    componentType: 'switch',
  }),

  checkboxField: z.boolean().meta({
    label: 'Checkbox Option',
    componentType: 'checkbox',
  }),

  // Select/Enum inputs
  selectField: z.enum(['option1', 'option2', 'option3']).meta({
    label: 'Select Dropdown',
    componentType: 'select',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
  }),

  countrySelect: z.enum(['us', 'uk', 'ca', 'au']).meta({
    label: 'Country',
    componentType: 'select',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'ca', label: 'Canada' },
      { value: 'au', label: 'Australia' },
    ],
  }),

  // Radio group
  radioField: z.enum(['small', 'medium', 'large']).meta({
    label: 'Size (Radio Group)',
    componentType: 'radio',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ],
  }),

  // Optional fields
  optionalText: z.string().optional().meta({
    label: 'Optional Field',
    placeholder: 'This field is not required',
    helperText: 'You can leave this empty',
  }),

  // Date field (if supported)
  dateField: z.string().optional().meta({
    label: 'Date',
    componentType: 'date',
  }),
});

type FieldTypesData = z.infer<typeof fieldTypesSchema>;

export function FieldTypesExample() {
  const handleSubmit = (data: FieldTypesData) => {
    console.log('Field types form submitted:', data);
    alert('Check the console for submitted data!');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Field Types Showcase
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        This example demonstrates all supported field types and their various
        configurations. Each field type is automatically determined from the Zod
        schema and meta properties.
      </Typography>

      <Divider sx={{ my: 3 }} />

      <SchemaForm
        schema={fieldTypesSchema}
        uiAdapter={MUIAdapter}
        onSubmit={handleSubmit}
        defaultValues={{
          switchField: false,
          checkboxField: false,
          selectField: 'option1',
          countrySelect: 'us',
          radioField: 'medium',
        }}
        mode="onBlur"
      />

      <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          💡 Field Type Mapping
        </Typography>
        <Typography variant="body2" component="div">
          <strong>Text Fields:</strong> z.string() → TextField
          <br />
          <strong>Password:</strong> componentType: 'password' → TextField
          type="password"
          <br />
          <strong>Email:</strong> z.string().email() → TextField type="email"
          <br />
          <strong>Textarea:</strong> componentType: 'textarea' → TextField
          multiline
          <br />
          <strong>Number:</strong> z.number() or componentType: 'number' →
          TextField type="number"
          <br />
          <strong>Switch:</strong> componentType: 'switch' → Switch
          <br />
          <strong>Checkbox:</strong> componentType: 'checkbox' → Checkbox
          <br />
          <strong>Select:</strong> z.enum() + componentType: 'select' → Select
          <br />
          <strong>Radio:</strong> z.enum() + componentType: 'radio' → RadioGroup
          <br />
          <strong>Date:</strong> componentType: 'date' → DatePicker (if
          available)
        </Typography>
      </Box>
    </Box>
  );
}
