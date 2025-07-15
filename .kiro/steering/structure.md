# Project Structure

## Monorepo Organization
This is a Turborepo monorepo with pnpm workspaces following a standard apps/packages structure.

## Root Level
- **Root package.json**: Workspace scripts and shared dev dependencies
- **turbo.json**: Build pipeline configuration and task dependencies
- **pnpm-workspace.yaml**: Workspace package definitions
- **biome.json**: Code quality and formatting configuration

## Apps (`apps/`)
Applications that consume the core library:

- **`apps/docs/`**: Next.js documentation and example app
  - Runs on port 3001 in development
  - Contains interactive examples and component demos
  - Uses Material-UI for styling

## Packages (`packages/`)
Reusable libraries and configurations:

- **`packages/schemaform-core/`**: Main library package (`@schemaform/core`)
  - **`src/adapters/`**: UI library adapters (MUI, Default)
  - **`src/components/`**: Core React components (SchemaForm)
  - **`src/core/`**: Core functionality and exports
  - **`src/hooks/`**: React hooks (error handling, etc.)
  - **`src/types/`**: TypeScript type definitions
  - **`src/utils/`**: Utility functions (schema, error handling)
  - **`src/styles/`**: Core CSS styles

- **`packages/typescript-config/`**: Shared TypeScript configurations
  - `base.json`: Base TypeScript config
  - `nextjs.json`: Next.js specific config
  - `react-library.json`: React library config

## Configuration Files
- **`.env`**: Environment variables
- **`.gitignore`**: Git ignore patterns
- **`.npmrc`**: npm/pnpm configuration

## Development Folders
- **`.turbo/`**: Turborepo cache and build artifacts
- **`node_modules/`**: Dependencies (workspace root)
- **`.kiro/`**: Kiro AI assistant configuration and steering rules

## Naming Conventions
- Package names use `@schemaform/` scope
- Workspace references use `workspace:*` for internal dependencies
- TypeScript configs follow descriptive naming (base, nextjs, react-library)
- Source files use camelCase, components use PascalCase

## Build Outputs
- Core library builds to `dist/` with ESM/CJS dual format
- Next.js apps build to `.next/`
- Turborepo caches builds in `.turbo/cache/`