// src/pages/DetalhesPerfil.jsx (CÓDIGO SIMPLIFICADO PARA REDIRECIONAR AO CADASTRO)
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Não precisamos mais de useAuth, useState, useEffect, api, etc.

const DetalhesPerfil = () => {
    const navigate = useNavigate();

    // Efeito para redirecionar imediatamente após a montagem do componente
    useEffect(() => {
        // Redireciona para a tela de formulário (onde a edição/cadastro ocorre)
        navigate('/perfil/editar', { replace: true });
    }, [navigate]);

    // Exibe uma tela de "Carregando" brevemente enquanto o redirecionamento ocorre
    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Redirecionando para Cadastro/Edição...</h1>
            {/* Você pode manter o componente DetalhesPerfil com a lógica de busca APENAS
            se a rota /meu-perfil não puder ser removida do roteamento.
            No seu caso, o navigate resolve. */}
        </div>
    );
};

export default DetalhesPerfil;