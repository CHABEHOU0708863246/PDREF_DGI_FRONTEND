import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.angular/**',
      'playwright-report/**',
      'test-results/**',
      'lighthouse-report/**',
    ],
  },
  {
    files: ['src/**/*.ts'],
    extends: [...tseslint.configs.recommended, ...angular.configs.tsRecommended],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': 'error',
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message: 'Utilisez StorageService (allowlist, aucune donnee sensible).',
        },
        {
          name: 'sessionStorage',
          message: 'Interdit : utilisez StorageService ou l etat memoire.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'document',
          property: 'cookie',
          message: 'Le cookie de refresh est HttpOnly, gere par le navigateur.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/mouse-events-have-key-events': 'error',
      '@angular-eslint/template/no-autofocus': 'error',
    },
  },
  {
    files: [
      'src/app/core/services/storage/storage.service.ts',
      'src/app/core/services/logging/logger.service.ts',
    ],
    rules: {
      'no-restricted-globals': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['src/**/*.spec.ts'],
    rules: {
      'no-restricted-globals': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettier,
);
