import { defineConfig } from "eslint/config";
import globals from 'globals'
import js from '@eslint/js'
import astro from 'eslint-plugin-astro'
import tseslint from 'typescript-eslint'

const tsParser = tseslint.parser;
const astroParser = astro.parser;

export default defineConfig([
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.astro/**',
      '**/*.d.ts', // Ignore generated TypeScript declaration files
    ],
  },

  // Base configuration for all files
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // ESLint recommended rules
  js.configs.recommended,
  tseslint.configs.recommended,

  // Astro files
  astro.configs.recommended,
  astro.configs["jsx-a11y-strict"],
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.astro'],
        sourceType: "module",
        ecmaVersion: "latest",
        project: "./tsconfig.json",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
]);
