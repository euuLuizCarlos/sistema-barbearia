// src/services/api.js - CÓDIGO FINAL COM INTERCEPTOR DE AUTENTICAÇÃO
import axios from 'axios';

// Cria uma instância do axios configurada com a URL base da sua API
const api = axios.create({
  baseURL: 'http://localhost:3000', 
});

// 1. CONFIGURAÇÃO DO INTERCEPTOR
api.interceptors.request.use(async (config) => {
    // Pega o token do localStorage
    const token = localStorage.getItem('userToken');

    // Se o token existir, adiciona o cabeçalho de Autorização
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;