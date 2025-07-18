import { config as baseConfig } from '@schemaform/eslint-config/base';

export default [
  ...baseConfig,
  {
    ignores: ['dist/**', 'node_modules/**'],
  }
];
