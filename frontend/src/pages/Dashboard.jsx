// src/pages/Dashboard.jsx (CÓDIGO FINAL DE ROTEAMENTO DE PERFIS)
import React from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import DashboardBarbeiro from './DashboardBarbeiro'; 
import DashboardCliente from './DashboardCliente'; 

const Dashboard = () => {
    // Obtém o usuário e o estado de autenticação
    const { user, isAuthenticated } = useAuth();

    // Esta verificação é crucial, mas o PrivateRoute já a faz.
    if (!isAuthenticated) {
        return null; 
    }
    
    const userType = user?.userType;

    // Lógica para renderizar o Dashboard correto
    if (userType === 'barbeiro') {
        return <DashboardBarbeiro />;
    }
    
    if (userType === 'cliente') {
        return <DashboardCliente />;
    }

    // Caso o tipo não seja definido ou esteja carregando
    return <h1>Carregando seu painel...</h1>; 
};

export default Dashboard;