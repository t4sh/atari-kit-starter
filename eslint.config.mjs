import js from '@eslint/js';
import globals from 'globals';

export default [
  // -- Global ignores --------------------------------------------------------
  {
    ignores: [
      'out/',
      'out-standalone/',
      'out-spa/',
      'node_modules/',
      '.cache/',
      '.eleventy-cache/',
      'source-reference/',
      'scripts/',
    ],
  },

  // -- Browser JS (src/assets/js/*) ------------------------------------------
  {
    files: ['src/assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        lucide: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-var': 'warn',
      'prefer-const': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      curly: ['warn', 'multi-line'],
    },
  },

  // -- 11ty config (CommonJS) ------------------------------------------------
  {
    files: ['eleventy.config.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
    },
  },

  // -- Node build scripts (ESM) ----------------------------------------------
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
    },
  },
];
