// src/main.jsx (CÓDIGO CORRETO)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx'; // 1. GARANTIR ESTE IMPORT
import { UiProvider } from './contexts/UiContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <UiProvider>
        <App />
      </UiProvider>
    </AuthProvider>
  </React.StrictMode>,
);