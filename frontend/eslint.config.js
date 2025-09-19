import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules/**',
      'dev-dist/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'src/components/**',
      'src/pages/AdminTermPage.tsx',
      'src/pages/ContributorPage.tsx',
      'src/pages/LinguistPage.tsx',
      'src/App.tsx',
      'src/pages/SearchPage.tsx',
      'src/pages/TermDetailPage.tsx',
      'src/sw.ts',
      'src/utils/syncManager.ts',
      'src/utils/cacheUpdater.ts',
    ],
  },

  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react-x': reactX,
      'react-dom': reactDom,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      ...reactX.configs['recommended-typescript'].rules,
      ...reactDom.configs.recommended.rules,
    },
  },
);
