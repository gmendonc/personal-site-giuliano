import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';

export default [
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'public/fontes/**'],
  },

  js.configs.recommended,
  ...astro.configs.recommended,

  /* TypeScript: quem checa tipo é `astro check`. Aqui o parser existe só para
     o ESLint conseguir ler o arquivo; no-undef sai porque o TS já resolve. */
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: { 'no-undef': 'off' },
  },

  /* Blocos <script> de componentes .astro rodam no navegador. */
  {
    files: ['**/*.astro'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  /* Scripts de build e de verificação rodam no Node. */
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
];
