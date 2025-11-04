// src/pages/Dashboard.jsx (NOVO CÓDIGO FINAL)
import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // NOVO IMPORT
import DashboardBarbeiro from './DashboardBarbeiro'; // IMPORT
import DashboardCliente from './DashboardCliente'; // IMPORT

const Dashboard = () => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        // Redirecionamento de segurança (Embora o PrivateRoute já faça isso)
        return null; 
    }
    
    const userType = user?.userType;

    if (userType === 'barbeiro') {
        return <DashboardBarbeiro />;
    }
    
    if (userType === 'cliente') {
        return <DashboardCliente />;
    }

    // Caso de usuário logado, mas sem tipo definido (erro)
    return <h1>Erro: Tipo de usuário desconhecido.</h1>; 
};

export default Dashboard;