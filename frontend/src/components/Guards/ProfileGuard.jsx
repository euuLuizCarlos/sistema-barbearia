// src/components/Guards/ProfileGuard.jsx (CÓDIGO FINAL E CORRIGIDO - CHECA TOKEN ANTES DA API)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../../services/api';

const ProfileGuard = () => {
    const { user, userType, isAuthenticated } = useAuth();
    const [profileExists, setProfileExists] = useState(false); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkProfile = async () => {
            // Se não estiver logado ou for Cliente, permite (deixa o PrivateRoute cuidar)
            if (!isAuthenticated || userType === 'cliente') {
                setProfileExists(true);
                setLoading(false);
                return;
            }
            
            // Checagem CRÍTICA APENAS para Barbeiro Autenticado
            // Só executa a API se o token estiver disponível no contexto!
            if (isAuthenticated && userType === 'barbeiro' && user.token) { // <-- CHECAGEM DE TOKEN AQUI
                try {
                    const response = await api.get('/perfil/barbeiro');
                    setProfileExists(response.data.profileExists);
                } catch (error) {
                    console.error('Erro ao checar perfil:', error);
                    setProfileExists(false); 
                }
            }
            setLoading(false);
        };

        checkProfile();
    }, [isAuthenticated, userType, user?.token]); // Adicionamos user.token como dependência

    if (loading) {
        return <h2 style={{ padding: '50px', color: '#023047' }}>Verificando perfil...</h2>;
    }
    
    // LÓGICA CRÍTICA DE REDIRECIONAMENTO
    if (isAuthenticated && userType === 'barbeiro' && !profileExists) {
        // Barbeiro logado, mas SEM PERFIL: Manda para o cadastro obrigatório
        return <Navigate to="/perfil/cadastro" replace />;
    }

    // Se o perfil existe (ou é cliente), permite o acesso
    return <Outlet />;
};

export default ProfileGuard;