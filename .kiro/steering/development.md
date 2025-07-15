# Development Guidelines

## Code Implementation Focus

### Primary Objectives

- Focus on implementing core functionality and features
- Prioritize production-ready code over testing infrastructure
- Implement comprehensive error handling and validation logic
- Create robust, type-safe implementations

### Testing Strategy

- **DO NOT write test files** during feature implementation
- **DO NOT create `__tests__` directories** or test files
- **DO NOT write unit tests, integration tests, or any test code**
- Focus development time on core functionality implementation
- Testing will be handled separately in dedicated testing phases

### Implementation Priorities

1. **Core Functionality**: Implement the main features and business logic
2. **Type Safety**: Ensure comprehensive TypeScript types and interfaces
3. **Error Handling**: Implement robust error management and validation
4. **Performance**: Focus on efficient, optimized implementations
5. **Documentation**: Include clear JSDoc comments and inline documentation

### File Structure Guidelines

- Create only production code files
- Avoid creating test-related directories or files
- Focus on `src/` directory structure for implementation
- Export utilities and components from appropriate index files

### Code Quality

- Write clean, maintainable, and well-documented code
- Follow TypeScript best practices and strict typing
- Implement proper error boundaries and validation
- Use consistent naming conventions and code organization

### Development Workflow

- Implement features incrementally and systematically
- Build and verify compilation after each major change
- Focus on completing functional requirements before optimization
- Ensure proper integration between components and utilities

## Key Reminders

- **No test files**: Skip all test file creation during implementation
- **Production focus**: Concentrate on shipping-ready code
- **Feature completion**: Prioritize completing functional requirements
- **Type safety**: Maintain strict TypeScript compliance
