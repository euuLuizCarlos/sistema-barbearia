// src/pages/Login.jsx - REDESIGN MINIMALISTA COM FUNDO BRANCO E QUADRO AZUL
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext'; 
import barberLogo from '../assets/Gemini_Generated_Image_lkroqflkroqflkro.png'; 

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Verificando credenciais...'); 
        
        try {
            const response = await api.post('/auth/login', { 
                email: formData.email,
                password: formData.password
            });

            login(response.data.token, response.data.userId, response.data.userName);
            
            setMessage('Login efetuado com sucesso! Redirecionando...');
            setTimeout(() => {
                navigate('/'); 
            }, 1000);

        } catch (error) {
            let errorMessage = error.response?.data?.error || 'Erro de rede. Verifique se o backend está rodando.';
            setMessage(errorMessage);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            // FUNDO BRANCO
            backgroundColor: '#FFFFFF', 
            color: '#333',
            fontFamily: 'Arial, sans-serif',
            padding: '20px'
        }}>
            {/* CONTAINER CENTRAL (O "QUADRADO AZUL") */}
            <div style={{
                backgroundColor: '#023047', // AZUL MARINHO ESCURO (Cor Principal)
                padding: '40px',
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                maxWidth: '380px',
                width: '100%',
                boxSizing: 'border-box',
                color: '#fff' // Texto dentro do quadro será branco
            }}>
                
                {/* ÁREA DO LOGO E TÍTULO (Centralizada no Quadro) */}
                <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                    <img
                        src={barberLogo}
                        alt="BarberApp Logo"
                        style={{ width: '140px', height: 'auto', marginBottom: '10px' }} // Tamanho ajustado
                    />
                    <h2 style={{ margin: '0', fontSize: '1.5em', color: '#FFB703' }}>Área de Acesso</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        required
                        style={{
                            width: 'calc(100% - 20px)',
                            padding: '12px 10px',
                            marginBottom: '20px',
                            border: '1px solid #455a64', // Bordas mais escuras
                            borderRadius: '5px',
                            fontSize: '1em',
                            backgroundColor: '#fff', // Fundo do input branco
                            color: '#333'
                        }}
                    />
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Senha"
                        required
                        style={{
                            width: 'calc(100% - 20px)',
                            padding: '12px 10px',
                            marginBottom: '30px',
                            border: '1px solid #455a64', // Bordas mais escuras
                            borderRadius: '5px',
                            fontSize: '1em',
                            backgroundColor: '#fff', // Fundo do input branco
                            color: '#333'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '12px 10px',
                            backgroundColor: '#FFB703', // Dourado/Mostarda (DESTAQUE)
                            color: '#023047', // Texto Azul Marinho
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '1.1em',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#cc9000'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFB703'}
                    >
                        Entrar
                    </button>
                </form>

                {/* Mensagens de Status (Dentro do Quadro Azul) */}
                {message && (
                    <p 
                        style={{ 
                            marginTop: '20px', 
                            fontWeight: 'bold',
                            fontSize: '0.9em',
                            // Cores de mensagem ajustadas para o fundo azul marinho
                            color: message.includes('sucesso') ? '#90ee90' : (message.includes('Verificando') ? '#fff' : '#ff9999')
                        }}
                    >
                        {message}
                    </p>
                )}
                <p style={{ marginTop: '30px', fontSize: '0.9em' }}>
                    <a 
                        href="/register" 
                        style={{ 
                            color: '#FFB703', // Dourado para link
                            textDecoration: 'none', 
                            fontWeight: 'bold' 
                        }}
                        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                        Registrar-se
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Login;