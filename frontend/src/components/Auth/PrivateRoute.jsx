// src/components/Auth/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
    // Verifica se o token existe no localStorage
    const isAuthenticated = localStorage.getItem('userToken');

    // Se estiver autenticado, renderiza as rotas filhas (Outlet)
    // Se não, redireciona para a página de Login
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;