'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Typography } from '@mui/material';
import { MUIAdapter, SchemaForm } from '@schemaform/core';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';

// Schema for controlled form example
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').meta({
    label: 'First Name',
    placeholder: 'Enter your first name',
  }),
  lastName: z.string().min(1, 'Last name is required').meta({
    label: 'Last Name',
    placeholder: 'Enter your last name',
  }),
  email: z.email('Invalid email format').meta({
    label: 'Email',
    placeholder: 'your.email@example.com',
  }),
  bio: z.string().optional().meta({
    label: 'Biography',
    componentType: 'textarea',
    placeholder: 'Tell us about yourself...',
  }),
});

type ProfileData = z.infer<typeof profileSchema>;

export function ControlledFormExample() {
  const [submittedData, setSubmittedData] = useState<ProfileData | null>(null);
  const [watchedValues, setWatchedValues] = useState<Partial<ProfileData>>({});

  // External form control
  const { control, handleSubmit, watch, formState, reset } =
    useForm<ProfileData>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        firstName: '',
        lastName: '',
        email: '',
        bio: '',
      },
      mode: 'onChange',
    });

  // Watch all form values
  const formValues = watch();

  // Update watched values for display
  React.useEffect(() => {
    setWatchedValues(formValues);
  }, [formValues]);

  const onSubmit = (data: ProfileData) => {
    console.log('Controlled form submitted:', data);
    setSubmittedData(data);
  };

  const handleReset = () => {
    reset();
    setSubmittedData(null);
  };

  const handlePrefill = () => {
    reset({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      bio: 'Software developer with 5+ years of experience in React and TypeScript.',
    });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Controlled Mode Example
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        External form control allows you to programmatically manage form state,
        watch values in real-time, and integrate with complex application logic.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="outlined" onClick={handlePrefill}>
          Prefill Demo Data
        </Button>
        <Button variant="outlined" onClick={handleReset}>
          Reset Form
        </Button>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <SchemaForm
          schema={profileSchema}
          uiAdapter={MUIAdapter}
          control={control}
          onSubmit={() => {}} // Handled by external handleSubmit
        />

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={!formState.isValid}
          >
            Submit Profile
          </Button>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ alignSelf: 'center' }}
          >
            Form is {formState.isValid ? 'valid' : 'invalid'}
          </Typography>
        </Box>
      </form>

      {/* Real-time values display */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Real-time Values:
        </Typography>
        <pre style={{ fontSize: '0.875rem', margin: 0, overflow: 'auto' }}>
          {JSON.stringify(watchedValues, null, 2)}
        </pre>
      </Box>

      {/* Submitted data display */}
      {submittedData && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="h6">Profile Submitted Successfully!</Typography>
          <Box
            sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}
          >
            <pre style={{ fontSize: '0.875rem', margin: 0, overflow: 'auto' }}>
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </Box>
        </Alert>
      )}
    </Box>
  );
}
