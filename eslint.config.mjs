// @ts-check

import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  globalIgnores(['dist', 'lib']),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        { assertionStyle: 'never' },
      ],
      'no-plusplus': 'warn',
    },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
  {
    files: ['src/**/__tests__/**', 'src/utils/**'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    ignores: ['src/**/__tests__/**', 'scripts/**'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.web.json'],
      },
    },
    rules: {
      '@typescript-eslint/strict-boolean-expressions': 'warn',
    },
  },
])
