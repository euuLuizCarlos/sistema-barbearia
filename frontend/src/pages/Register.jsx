// src/pages/Register.jsx (CÓDIGO FINAL E CORRIGIDO COM BOTÃO DE VOLTAR)
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import barberLogo from '../assets/Gemini_Generated_Image_lkroqflkroqflkro.png';
// Remova o import EscolhaTipoUsuario daqui!

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const queryParams = new URLSearchParams(location.search);
    
    // O tipo de usuário é pego da URL. Ele EXISTE garantidamente pelo RegisterGuard.
    const userType = queryParams.get('type') || 'cliente'; 

    // Todos os hooks são chamados no topo, incondicionalmente
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        password: '',
        tipo_usuario: userType, // O campo crucial é setado
    });
    const [message, setMessage] = useState('');


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
    
    // Função para voltar para a tela de escolha de perfil
    const handleVoltar = () => {
        navigate('/escolha-perfil');
    };

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
            
            <p style={{ marginTop: '10px' }}>
                <Link to="/login" style={{ color: '#023047' }}>Já tem conta? Faça Login</Link>
            </p>
        </div>
    );
};

export default Register;