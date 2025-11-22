// src/pages/Login.jsx (CÓDIGO FINAL E COMPLETO - CORRIGINDO A IMAGEM E O FLUXO)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext'; 
import ShowPasswordToggle from '../components/ShowPasswordToggle';

// CORREÇÃO FINAL DA IMAGEM: Garante que a extensão .png (ou .jpg se você o renomeou) esteja correta
import barberLogo from '../assets/Gemini_Generated_Image_lkroqflkroqflkro.png'; 


const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [showForgotLink, setShowForgotLink] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'password') setShowForgotLink(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Verificando credenciais...'); 
        
        try {
            const response = await api.post('/auth/login', { 
                email: formData.email,
                password: formData.password
            });

            // SUCESSO:
            login(response.data.token, response.data.userId, response.data.userName, response.data.userType);
            
            setMessage('Login efetuado com sucesso! Redirecionando...');
            setTimeout(() => {
                navigate('/'); 
            }, 1000);

        } catch (error) {
            let errorMessage = error.response?.data?.error || 'Erro de rede. Verifique se o backend está rodando.';
            
            // LÓGICA CHAVE DE REDIRECIONAMENTO PARA ATIVAÇÃO NO 403
            if (error.response?.status === 403 && errorMessage.includes('Ativação pendente')) {
                 const pendingUserId = error.response.data?.userId;

                 setMessage(errorMessage + " Redirecionando para a ativação...");
                 
                 setTimeout(() => {
                    // REDIRECIONAMENTO CORRETO: Manda para a rota de ativação com o ID do usuário
                    navigate(`/ativacao?userId=${pendingUserId}`); 
                 }, 1500);
              } else {
                  // Erro normal (senha errada, usuário inexistente, etc.)
                  setMessage(errorMessage);
                  // Se for erro 401 (credenciais inválidas), mostramos o link "Esqueceu sua senha?"
                  if (error.response?.status === 401) setShowForgotLink(true);
              }
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#FFFFFF', 
            color: '#333',
            fontFamily: 'Arial, sans-serif',
            padding: '20px'
        }}>
            
            {/* CONTAINER CENTRAL (O "QUADRADO AZUL") */}
            <div style={{
                backgroundColor: '#023047', 
                padding: '40px',
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                maxWidth: '550px', // MAIS LARGO
                width: '100%',
                boxSizing: 'border-box',
                color: '#fff' 
            }}>
                
                {/* ÁREA DO LOGO E TÍTULO */}
                <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                    <img
                        src={barberLogo}
                        alt="BarberApp Logo"
                        style={{ width: '90%', height: 'auto', margin: '0 0 15px 0' }} 
                    />
                    <h2 style={{ margin: '0', fontSize: '1.5em', color: '#FFB703' }}>Área de Acesso</h2>
                    <p style={{ margin: '5px 0 30px 0', fontSize: '0.9em', color: '#ccc' }}>Entre com suas credenciais de barbeiro.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* INPUTS */}
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        required
                        style={{ width: '100%', padding: '12px 10px', marginBottom: '20px', border: '1px solid #455a64', borderRadius: '5px', fontSize: '1em', backgroundColor: '#fff', color: '#333' }}
                    />
                    <div style={{ position: 'relative', marginBottom: '30px' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Senha"
                            required
                            style={{ width: '100%', padding: '12px 40px 12px 10px', border: '1px solid #455a64', borderRadius: '5px', fontSize: '1em', backgroundColor: '#fff', color: '#333' }}
                        />
                        <ShowPasswordToggle show={showPassword} onToggle={() => setShowPassword(s => !s)} ariaLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'} />
                    </div>
                    <button
                        type="submit"
                        style={{ width: '100%', padding: '12px 10px', backgroundColor: '#FFB703', color: '#023047', border: 'none', borderRadius: '5px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.3s ease' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#cc9000'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFB703'}
                    >
                        Entrar
                    </button>
                </form>

                {/* Mensagens de Status */}
                {message && (
                    <p 
                        style={{ 
                            marginTop: '20px', fontWeight: 'bold', fontSize: '0.9em',
                            color: message.includes('sucesso') ? '#90ee90' : (message.includes('Verificando') ? '#fff' : '#ff9999')
                        }}
                    >
                        {message}
                    </p>
                )}
                
                <p style={{ marginTop: '30px', fontSize: '0.9em' }}>
                    <a 
                        href="/register" 
                        style={{ color: '#FFB703', textDecoration: 'none', fontWeight: 'bold' }}
                        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                        Não tem conta? Cadastre-se
                    </a>
                </p>
                {showForgotLink && (
                    <p style={{ marginTop: '8px', fontSize: '0.9em' }}>
                        <a href="/forgot-password" style={{ color: '#FFB703', textDecoration: 'none', fontWeight: 'bold' }}
                            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>
                            Esqueceu sua senha?
                        </a>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;