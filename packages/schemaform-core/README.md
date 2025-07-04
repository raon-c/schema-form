# SchemaForm Core

A powerful, type-safe form library that generates React forms from Zod schemas with support for multiple UI libraries through adapters.

## 📁 Project Structure

```
src/
├── core/              # Core form engine functionality
│   ├── useSchemaForm.ts    # Main hook for form state management
│   ├── SchemaForm.tsx      # Main SchemaForm component
│   └── types.ts            # Core type definitions
├── adapters/          # UI library adapters
│   ├── DefaultUIAdapter.ts # Default HTML adapter
│   ├── MUIAdapter.ts       # Material-UI adapter
│   └── types.ts            # Adapter type definitions
├── components/        # Reusable form components
│   ├── Field.tsx           # Generic field component
│   ├── FieldLayout.tsx     # Field layout component
│   └── ConditionalField.tsx # Conditional field component
├── types/             # TypeScript type definitions
│   ├── SchemaForm.ts       # SchemaForm types
│   ├── UIAdapter.ts        # UI adapter interfaces
│   ├── FieldMetadata.ts    # Field metadata types
│   └── common.ts           # Common type definitions
├── utils/             # Utility functions
│   ├── schemaParser.ts     # Zod schema parsing utilities
│   ├── fieldMetadata.ts    # Field metadata helpers
│   ├── validation.ts       # Validation utilities
│   └── helpers.ts          # General helper functions
├── hooks/             # React hooks
│   ├── useSchemaForm.ts    # Form state management hook
│   ├── useFieldMetadata.ts # Field metadata hook
│   └── useConditionalFields.ts # Conditional fields hook
└── index.ts           # Main library entry point
```

## 🚀 Features (Planned)

- **Type-safe**: Built with TypeScript and Zod for complete type safety
- **Schema-driven**: Generate forms automatically from Zod schemas
- **Adapter pattern**: Support for multiple UI libraries (HTML, Material-UI, etc.)
- **Conditional fields**: Show/hide fields based on other field values
- **Async validation**: Support for server-side validation
- **Customizable**: Extensive customization options for styling and layout
- **Performance**: Optimized for large forms with minimal re-renders

## 📦 Installation

```bash
npm install @your-org/schemaform-core
# or
yarn add @your-org/schemaform-core
# or
pnpm add @your-org/schemaform-core
```

## 🔧 Development

This package is part of a monorepo. To develop:

1. Install dependencies: `pnpm install`
2. Build: `pnpm build`
3. Test: `pnpm test`
4. Dev mode: `pnpm dev`

## 📚 Documentation

Full documentation will be available at [documentation link] once the library is complete.

## 🤝 Contributing

This is part of a larger monorepo project. Please see the main repository README for contribution guidelines.

## 📄 License

[License information] 