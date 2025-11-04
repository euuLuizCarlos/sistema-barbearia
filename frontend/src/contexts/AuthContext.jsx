// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Efeito para carregar o usuário do localStorage ao iniciar
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        const token = localStorage.getItem('userToken');
        
        if (userId && token) {
            setUser({ userId: parseInt(userId), userName, token });
        }
    }, []);

    // Função que é chamada no Login
    const login = (token, userId, userName) => {
        localStorage.setItem('userToken', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('userName', userName);
        setUser({ userId: parseInt(userId), userName, token });
    };

    // Função que é chamada no Logout
    const logout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        setUser(null);
        window.location.href = '/login'; // Redireciona
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);