// src/pages/Register.jsx (CÓDIGO FINAL E CORRIGIDO - COM LÓGICA DE ESCOLHA)
import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import api from '../services/api';
import barberLogo from '../assets/Gemini_Generated_Image_lkroqflkroqflkro.png';

// Importamos a tela de escolha
import EscolhaTipoUsuario from '../components/Auth/EscolhaTipoUsuario'; 

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const queryParams = new URLSearchParams(location.search);
    const userType = queryParams.get('type'); 
    
    // 1. VERIFICAÇÃO CRÍTICA (DEVE SER FEITA ANTES DE QUALQUER HOOK)
    if (!userType || (userType !== 'barbeiro' && userType !== 'cliente')) {
        // Se não houver tipo na URL, renderiza a tela de escolha
        // ATENÇÃO: Retorna o componente DE ESCOLHA AQUI, para evitar que os HOOKS abaixo sejam chamados
        return <EscolhaTipoUsuario />; 
    }

    // A partir daqui, SÓ ENTRAMOS SE userType for 'barbeiro' ou 'cliente' (Hooks são seguros)
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        password: '',
        tipo_usuario: userType, // O campo crucial é setado
    });
    const [message, setMessage] = useState('');
    // ... (continua com as funções handleChange, handleSubmit, etc)
    
    // ... (funções handleChange e handleSubmit, que permanecem as mesmas) ...
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Cadastrando...');
        
        try {
            const response = await api.post('/auth/register', formData);

            setMessage(response.data.message + ' Redirecionando para o Login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Erro no cadastro. Verifique a conexão.';
            setMessage(errorMessage);
        }
    };
    // Fim das funções
    
    return (
        <div style={{ padding: '40px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' }}>
            <img src={barberLogo} alt="Logo" style={{ width: '80px', marginBottom: '10px' }} />
            <h2 style={{ color: '#023047' }}>Registro como {userType.toUpperCase()}</h2>
            
            <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome Completo" required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }} />
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Senha" required style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '4px' }} />
                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#FFB703', color: '#023047', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Finalizar Cadastro
                </button>
            </form>
            
            {message && <p style={{ marginTop: '15px', color: message.includes('sucesso') ? 'green' : 'red' }}>{message}</p>}
            <p style={{ marginTop: '20px' }}>
                <Link to="/login" style={{ color: '#023047' }}>Já tem conta? Faça Login</Link>
            </p>
        </div>
    );
};

export default Register;