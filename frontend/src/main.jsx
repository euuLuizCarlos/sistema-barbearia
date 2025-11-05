// src/main.jsx (CÓDIGO CORRETO)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx'; // 1. GARANTIR ESTE IMPORT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* 2. O AuthProvider DEVE ENVOLVER O APP */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
);