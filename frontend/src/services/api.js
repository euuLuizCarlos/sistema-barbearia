// src/services/api.js (CÓDIGO ROBUSTO E FINAL)
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', 
});

// CONFIGURAÇÃO DO INTERCEPTOR DE REQUISIÇÃO (GARANTE QUE O TOKEN É INSERIDO)
api.interceptors.request.use((config) => { 
    const token = localStorage.getItem('userToken');

    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';

    return config;
});

export default api;