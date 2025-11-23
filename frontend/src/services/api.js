import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', 
});

// 🚨 NOVO INTERCEPTOR PARA TRATAMENTO DE UPLOAD (Content-Type) 🚨
// src/services/api.jsx
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('userToken');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Garante que APENAS dados que NÃO são arquivos (FormData) usem JSON
    if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    } else {
        // Se for FormData, o Content-Type é deixado vazio para o browser definir multipart/form-data
        delete config.headers['Content-Type']; 
    }

    return config;
});

export default api;