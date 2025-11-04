// src/main.jsx (ou main.tsx) - NOVO CÓDIGO
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx'; // 1. NOVO IMPORT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. ENVOLVER A APLICAÇÃO COM O PROVEDOR DE AUTENTICAÇÃO */}
    <AuthProvider> 
      <App />
    </AuthProvider>
  </React.StrictMode>,
);