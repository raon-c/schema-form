# @schemaform/mui-adapter

Material-UI adapter for SchemaForm library. This package provides Material-UI components for rendering form fields in SchemaForm.

## Installation

```bash
npm install @schemaform/mui-adapter @schemaform/core
# or
pnpm add @schemaform/mui-adapter @schemaform/core
# or
yarn add @schemaform/mui-adapter @schemaform/core
```

## Peer Dependencies

This package requires the following peer dependencies:

- `@mui/material` ^5.0.0
- `@emotion/react` ^11.0.0
- `@emotion/styled` ^11.0.0
- `react` ^19.0.0
- `react-dom` ^19.0.0
- `react-hook-form` ^7.59.0

## Usage

```tsx
import { SchemaForm } from '@schemaform/core';
import { MUIAdapter } from '@schemaform/mui-adapter';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be at least 18'),
});

function MyForm() {
  const handleSubmit = (data: z.infer<typeof schema>) => {
    console.log('Form data:', data);
  };

  return (
    <SchemaForm
      schema={schema}
      uiAdapter={MUIAdapter}
      onSubmit={handleSubmit}
    />
  );
}
```

## Supported Field Types

The MUI adapter supports the following field types:

- `text` - Material-UI TextField
- `password` - Material-UI TextField with password type
- `email` - Material-UI TextField with email type
- `url` - Material-UI TextField with url type
- `tel` - Material-UI TextField with tel type
- `search` - Material-UI TextField with search type
- `number` - Material-UI TextField with number type
- `textarea` - Material-UI TextField with multiline
- `select` - Material-UI Select with FormControl
- `checkbox` - Material-UI Checkbox with FormControlLabel
- `switch` - Material-UI Switch with FormControlLabel
- `radio` - Material-UI RadioGroup with Radio buttons
- `date` - Material-UI TextField with date type

## Features

- **Full Material-UI Integration**: Uses native Material-UI components
- **Accessibility Support**: Includes proper ARIA attributes and screen reader support
- **Async Validation**: Shows loading indicators during async validation
- **Error Handling**: Displays validation errors with Material-UI styling
- **Custom Components**: Support for custom component rendering
- **TypeScript Support**: Full TypeScript definitions included

## API

### MUIAdapter

The main adapter object that implements the `UIAdapter` interface from `@schemaform/core`.

```tsx
import { MUIAdapter } from '@schemaform/mui-adapter';

// Use with SchemaForm
<SchemaForm
  schema={schema}
  uiAdapter={MUIAdapter}
  onSubmit={handleSubmit}
/>
```

## License

MIT
