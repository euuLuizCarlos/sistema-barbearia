// src/App.jsx - CÓDIGO FINAL COM SPLASH SCREEN E REDIRECIONAMENTO

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Transacoes from './pages/Transacoes';
import Relatorios from './pages/Relatorios';
import Agenda from './pages/Agenda';
import SplashScreen from './components/SplashScreen'; // Importa a Splash Screen


// Componente PrivateRoute que verifica a autenticação
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Pode mostrar um spinner aqui enquanto verifica o token
    return <div>Carregando autenticação...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <NavBar />}
      <div className={isAuthenticated ? "content-with-navbar" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/transacoes" element={<PrivateRoute><Transacoes /></PrivateRoute>} />
          <Route path="/relatorios" element={<PrivateRoute><Relatorios /></PrivateRoute>} />
          <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
          
          {/* Redireciona qualquer rota não encontrada para a dashboard (se autenticado) ou login */}
          <Route path="*" element={isAuthenticated ? <Navigate to="/" /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // 2 segundos de delay

    return () => clearTimeout(timer); // Limpa o timer se o componente for desmontado
  }, []);

  return (
    <Router>
      <AuthProvider>
        {showSplash ? (
          <SplashScreen />
        ) : (
          <AppContent />
        )}
      </AuthProvider>
    </Router>
  );
}

export default App;