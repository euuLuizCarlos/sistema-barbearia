// src/services/api.js - CÓDIGO FINAL E CORRIGIDO PARA TOKEN
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', 
});

// CONFIGURAÇÃO DO INTERCEPTOR DE REQUISIÇÃO (SOLUÇÃO FINAL)
api.interceptors.request.use(async (config) => {
    // Pega o token do localStorage
    const token = localStorage.getItem('userToken');

    // Se o token existir, adiciona o cabeçalho de Autorização
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Adiciona o cabeçalho Content-Type (Garantia)
    if (config.method === 'post' || config.method === 'put') {
        config.headers['Content-Type'] = 'application/json';
    }

    return config;
});

export default api;