// src/components/Guards/ProfileGuard.jsx (CÓDIGO CORRIGIDO PARA FORÇAR REDIRECIONAMENTO)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../../services/api';

const ProfileGuard = () => {
    const { user, userType, isAuthenticated } = useAuth();
    const [profileExists, setProfileExists] = useState(true); // Assumimos true para não travar o cliente
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkProfile = async () => {
            // Só checa se for Barbeiro e estiver autenticado
            if (isAuthenticated && userType === 'barbeiro') {
                try {
                    const response = await api.get('/perfil/barbeiro'); // Rota que criamos no backend
                    
                    if (response.data.profileExists) {
                        setProfileExists(true);
                    } else {
                        // Perfil NÃO existe
                        setProfileExists(false);
                    }
                } catch (error) {
                    console.error('Erro ao checar perfil:', error);
                    setProfileExists(false); // Assume que precisa cadastrar em caso de erro de API
                }
            } else {
                // Cliente ou não logado: não precisa de checagem de perfil (perfil OK)
                setProfileExists(true);
            }
            setLoading(false);
        };

        checkProfile();
    }, [isAuthenticated, userType]); // Roda a checagem sempre que o usuário ou o login mudar

    if (loading) {
        return <h2 style={{ padding: '50px', color: '#023047' }}>Verificando perfil...</h2>;
    }
    
    // A LÓGICA CHAVE DE BLOQUEIO E REDIRECIONAMENTO
    if (isAuthenticated && userType === 'barbeiro' && !profileExists) {
        // Barbeiro logado, mas SEM PERFIL: Manda para o cadastro
        return <Navigate to="/perfil/cadastro" replace />;
    }

    // Se o perfil existe (ou é cliente), permite o acesso ao Dashboard
    return <Outlet />;
};

export default ProfileGuard;