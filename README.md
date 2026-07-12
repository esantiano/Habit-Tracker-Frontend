# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Overview

This repository contains the frontend for Habit Tracker.

It provides:

- Authentication (JWT-based)
- Dashboard view
- Habit creation/editing
- Archive/restore
- Analytics dashboard
- GitHub-style heatmap
- Optimistic UI updates
- Toast notifications

---

## Tech Stack

- React
- TypeScript
- Vite
- React Query
- Custom heatmap component

---

## Features

### Dashboard

- Create daily or weekly habits
- Mark completion
- View streaks
- Archive / restore

### Analytics

- Overall completion rate
- Per-habit completion rate
- Consistency score
- GitHub-style activity heatmap

---
# Local Development Setup

## Prerequisites
This project requires the latest version of node.js and Node Version Manager to run Locally.

https://nodejs.org/en/download

https://www.nvmnode.com/guide/download.html

## 1. Configure Environment Variables
Create a ```.env``` file in the project root

For macOS or Linux
```
touch .env
```
For Windows 
```
New-Item .env
```

Set the VITE_API_URL locally use the port running Habit-Tracker-Backend.

```
VITE_API_URL=http://127.0.0.1:<backend-port>
```

The backend server must be running before starting the frontend application. 

Replace ```<backend-port>``` with the port where the Habit-Tracker-Backend is running. 

For example: 
```
VITE_API_URL=http://127.0.0.1:8000
```

## 2. Install Dependencies
```
npm install
```
## 3. Start the Development Server
Start the Vite development server: 
```
npm run dev
```
This application will typically be available at: 
http://127.0.0.1:5173

If port 5173 is already in use, Vite will automatically select another available port and display it in the terminal.

Stop the development server by pressing:

Ctrl + C
