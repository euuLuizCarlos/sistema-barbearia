// src/pages/RegisterGuard.jsx (NOVO COMPONENTE DE GUARDA)
import React from 'react';
import { useLocation } from 'react-router-dom';
import EscolhaTipoUsuario from '../components/Auth/EscolhaTipoUsuario'; // Componente de escolha

// Componente Real de Registro (Se a URL estiver ok)
import Register from './Register'; 

const RegisterGuard = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const userType = queryParams.get('type');

    // Se o tipo NÃO veio na URL, mostra a tela de escolha.
    if (!userType || (userType !== 'barbeiro' && userType !== 'cliente')) {
        return <EscolhaTipoUsuario />;
    }
    
    // Se o tipo for válido e estiver na URL, carrega o formulário (Register.jsx)
    // O formulário de Register não terá mais a lógica condicional, resolvendo o erro de Hooks.
    return <Register />;
};

export default RegisterGuard;