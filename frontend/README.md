# Source Library

A digital platform for preserving and translating classical texts on science and philosophy using advanced AI technology.

## Overview

Source Library is a React-based web application that allows users to:
- Curate classical texts from history's greatest thinkers
- Use AI-powered OCR to digitize old manuscripts and texts
- Translate classical works to make them accessible to modern readers
- Preserve philosophical and scientific knowledge for future generations

## Features

- **Text Management**: Add, edit, and organize classical texts
- **AI-Powered OCR**: Extract text from scanned pages using advanced AI models
- **Translation Services**: Translate texts between multiple languages
- **Batch Processing**: Process multiple pages simultaneously for efficiency
- **PDF Support**: Upload and process entire PDF documents
- **Responsive Design**: Optimized for desktop and mobile devices

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Technology Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Vite for fast development and building
- Heroicons for consistent iconography

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
