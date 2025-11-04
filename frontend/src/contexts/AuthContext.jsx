// src/contexts/AuthContext.jsx (CÓDIGO CORRIGIDO)
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // ... (restante do código: useState, useEffect, login, logout) ...
    const [user, setUser] = useState(null);

    // Efeito para carregar o usuário do localStorage ao iniciar
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        const userType = localStorage.getItem('userType'); // NOVO: TIPO DE USUÁRIO
        const token = localStorage.getItem('userToken');
        
        if (userId && token) {
            setUser({ userId: parseInt(userId), userName, userType, token });
        }
    }, []);


    // Função que é chamada no Login (para salvar os dados)
    const login = (token, userId, userName, userType) => { // NOVO PARÂMETRO: userType
        localStorage.setItem('userToken', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('userName', userName);
        localStorage.setItem('userType', userType);
        setUser({ userId: parseInt(userId), userName, userType, token });
    };

    // Função que é chamada no Logout (para limpar os dados)
    const logout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userType');
        setUser(null);
        window.location.href = '/login'; // Redireciona
    };

    // Objeto de valor para o contexto
    const contextValue = { 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user,
        // É importante que o NavBar possa acessar o userType para o Logout condicional
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook customizado que DEVE ser exportado junto com o AuthProvider
export const useAuth = () => useContext(AuthContext);