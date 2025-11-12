import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // <--- CAMINHO CORRIGIDO DEFINITIVAMENTE
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import api from '../../services/api';

const ProfileGuard = () => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();
    const [profileExists, setProfileExists] = useState(false);
    const [loading, setLoading] = useState(true);

    const isBarbeiroOrAdmin = user?.userType === 'barbeiro' || user?.userType === 'admin';

    // Rotas de GESTÃO PESADA que exigem o perfil completo
    const requiresFullProfile = [
        '/transacoes', '/servicos', '/horarios', '/relatorio', '/agenda', '/configuracoes'
    ].some(path => location.pathname.startsWith(path));


    // 1. Efeito para buscar o status do perfil
    const checkProfileStatus = useCallback(async () => {
        if (!isAuthenticated || !isBarbeiroOrAdmin) {
            setLoading(false);
            return;
        }

        try {
            // Rota GET /perfil/barbeiro
            const response = await api.get('/perfil/barbeiro');
            setProfileExists(response.data.profileExists); 
        } catch (err) {
            console.error("Erro no ProfileGuard ao buscar perfil:", err);
            setProfileExists(false); 
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isBarbeiroOrAdmin]);

    useEffect(() => {
        if (isAuthenticated && isBarbeiroOrAdmin) {
            checkProfileStatus();
        } else {
             setLoading(false);
        }
    }, [isAuthenticated, isBarbeiroOrAdmin, checkProfileStatus]); 


    if (loading) {
        return <h2 style={{ padding: '50px', color: '#023047' }}>Verificando perfil...</h2>;
    }
    
    // 2. LÓGICA CRÍTICA DE REDIRECIONAMENTO

    // Se o usuário não for Barbeiro, permite o acesso (Dashboard Cliente)
    if (!isBarbeiroOrAdmin) {
        return <Outlet />;
    }

    // Se for Barbeiro e o perfil for INCOMPLETO
    if (isBarbeiroOrAdmin && !profileExists) {
        
        // Se tentar acessar uma rota de GESTÃO PESADA (Ex: /transacoes)
        if (requiresFullProfile) {
            // Força o redirecionamento para o Cadastro Inicial
            return <Navigate to="/perfil/cadastro" replace />;
        }
    }
    
    // Permite o acesso se o Barbeiro tiver perfil, ou se for Cliente, ou se estiver em uma rota de visualização
    return <Outlet />;
};

export default ProfileGuard;