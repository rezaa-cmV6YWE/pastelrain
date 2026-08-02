// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'src/routeTree.gen.ts',
      '.cta.json',
      'dist/',
      'node_modules/',
    ],
  },
  {
    rules: {
      'import/order': 'off',
      'sort-imports': 'off',
    },
  },
]
