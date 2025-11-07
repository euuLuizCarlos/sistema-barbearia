// src/components/Guards/ProfileGuard.jsx (CÓDIGO SIMPLIFICADO PARA ESTABILIDADE)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../../services/api';

const ProfileGuard = () => {
    const { isAuthenticated, userType } = useAuth();
    const [loading, setLoading] = useState(true);

    // Simplificação: Apenas espera a autenticação e o tipo de usuário
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(true); // Continua loading até a autenticação carregar
            return;
        }
        // Se a autenticação carregou (isAuthenticated é true ou false), terminamos o loading
        setLoading(false);
    }, [isAuthenticated]); 

    if (loading) {
        return <h2 style={{ padding: '50px', color: '#023047' }}>Verificando acesso...</h2>;
    }
    
    // -------------------------------------------------------------
    // LÓGICA DE REDIRECIONAMENTO DE FORÇA BRUTA:
    // -------------------------------------------------------------
    
    // Este Guard NÃO fará mais o bloqueio do perfil. Ele apenas garante que
    // as rotas de cadastro/edição funcionem se o usuário estiver lá.
    
    // Se não for Barbeiro ou não estiver logado, o PrivateRoute já o redirecionou.
    
    // Se o usuário está na rota /perfil/cadastro ou /perfil/editar, permite
    if (window.location.pathname.startsWith('/perfil/cadastro') || window.location.pathname.startsWith('/perfil/editar')) {
        return <Outlet />;
    }

    // Para todas as outras rotas (Agenda, Transações, Dashboard), libera o acesso total.
    return <Outlet />;
};

export default ProfileGuard;