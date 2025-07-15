# Technology Stack

## Build System & Package Management
- **Turborepo**: Monorepo build system for coordinated builds and caching
- **pnpm**: Package manager with workspace support
- **tsup**: TypeScript bundler for library builds

## Core Technologies
- **TypeScript 5.8+**: Primary language with strict type checking
- **React 19+**: UI framework with latest features
- **Zod**: Schema validation and type inference
- **React Hook Form**: Form state management and validation
- **Next.js 15+**: Documentation app framework

## Code Quality & Formatting
- **Biome**: Unified linter, formatter, and code analyzer
- **ESLint**: Additional linting (legacy, being phased out for Biome)

## UI Libraries
- **Material-UI (MUI)**: Primary UI component library
- **Emotion**: CSS-in-JS styling solution

## Common Commands

### Development
```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm dev --filter=docs

# Build all packages
pnpm build

# Build specific package
pnpm build --filter=@schemaform/core
```

### Code Quality
```bash
# Check code quality (lint + format)
pnpm check

# Auto-fix issues
pnpm check:fix

# Format code
pnpm format:fix

# Type checking
pnpm check-types
```

### Package-specific Commands
```bash
# Core library development
cd packages/schemaform-core
pnpm dev  # Watch mode build

# Documentation app
cd apps/docs
pnpm dev  # Next.js dev server on port 3001
```

## Node.js Requirements
- **Node.js**: >= 18
- **pnpm**: 9.0.0 (specified in packageManager field)