// src/pages/Register.jsx (CÓDIGO FINAL E CORRIGIDO - COM CHAVES PARA ESTABILIDADE)
import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import api from '../services/api';
import barberLogo from '../assets/Gemini_Generated_Image_lkroqflkroqflkro.png';
import EscolhaTipoUsuario from '../components/Auth/EscolhaTipoUsuario'; 

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const queryParams = new URLSearchParams(location.search);
    const userType = queryParams.get('type'); 

    if (!userType || (userType !== 'barbeiro' && userType !== 'cliente')) {
        return <Navigate to="/escolha-perfil" replace />; 
    }

    const [registrationStep, setRegistrationStep] = useState(1);
    const [tempUserId, setTempUserId] = useState(null);
    const [chaveAcesso, setChaveAcesso] = useState('');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        nome: '', email: '', password: '', tipo_usuario: userType, 
    });


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // --- FUNÇÃO 1: CRIA O USUÁRIO (ETAPA 1) ---
    const handleInitialRegister = async (e) => {
        e.preventDefault();
        setMessage('Cadastrando usuário...');
        
        try {
            const response = await api.post('/auth/register', formData);
            const userId = response.data.userId;

            if (userType === 'cliente') {
                setMessage('Cadastro de Cliente concluído! Faça login.');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                const userId = response.data.userId;
                setTempUserId(userId); 
                setRegistrationStep(2); // Vai para a Etapa 2 (Chave)
                navigate(`/ativacao?userId=${userId}`);
                setMessage('Conta criada. Insira a chave de licença.');
            }

        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Erro no cadastro. Verifique a conexão.';
            setMessage(errorMessage);
        }
    };
    
    // --- FUNÇÃO 2: ATIVAÇÃO DE CONTA (ETAPA 2 - APENAS BARBEIRO) ---
    const handleActivation = async (e) => {
        e.preventDefault();
        setMessage('Verificando chave de acesso...');
        
        try {
            const response = await api.post('/auth/ativar-conta', { 
                userId: tempUserId,
                chaveAcesso: chaveAcesso 
            });

            setMessage(response.data.message + ' Redirecionando para o Login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Chave incorreta. Tente novamente.';
            setMessage(errorMessage);
        }
    };
    
    
    // --- INTERFACES DE RENDERIZAÇÃO ---
    
    // Interface do formulário de Chave de Acesso (ETAPA 2)
    const renderActivationForm = () => (
        // CORREÇÃO: ADICIONAMOS A KEY ÚNICA AQUI
        <form onSubmit={handleActivation} style={{ marginTop: '30px' }} key="form-step-2">
            <h2 style={{ color: '#FFB703', marginBottom: '10px' }}>Ativar Conta Barbeiro</h2>
            <p style={{ color: '#ccc', fontSize: '0.9em', marginBottom: '20px' }}>Insira a chave de licença mestre para concluir o cadastro. Chave: BAR-BER-APLI-MASTER-ADIMIN25</p>
            
            <input 
                type="text" 
                value={chaveAcesso} 
                onChange={(e) => setChaveAcesso(e.target.value)} 
                placeholder="CHAVE-DE-ACESSO-MESTRA"
                required
                style={{ width: '100%', padding: '12px 10px', marginBottom: '20px', border: '1px solid #455a64', borderRadius: '5px', fontSize: '1em', backgroundColor: '#fff', color: '#333' }}
            />
            
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#FFB703', color: '#023047', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                Ativar & Concluir
            </button>
            <p style={{ marginTop: '15px', color: '#ff9999' }}>A chave é: BAR-BER-APLI-MASTER-ADIMIN25</p>
        </form>
    );

    // Interface do formulário de Registro (ETAPA 1)
    const renderRegistrationForm = () => (
        // CORREÇÃO: ADICIONAMOS A KEY ÚNICA AQUI
        <form onSubmit={handleInitialRegister} style={{ marginTop: '30px' }} key="form-step-1">
            <h2 style={{ margin: '0', fontSize: '1.5em', color: '#FFB703' }}>Registro como {userType.toUpperCase()}</h2>
            <p style={{ margin: '5px 0 30px 0', fontSize: '0.9em', color: '#ccc' }}>Crie sua conta {userType} agora.</p>

            <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome Completo" required style={{ width: '100%', padding: '12px 10px', marginBottom: '15px', border: '1px solid #455a64', borderRadius: '5px', fontSize: '1em', backgroundColor: '#fff', color: '#333' }} />
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required style={{ width: '100%', padding: '12px 10px', marginBottom: '15px', border: '1px solid #455a64', borderRadius: '5px', fontSize: '1em', backgroundColor: '#fff', color: '#333' }} />
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Senha" required style={{ width: '100%', padding: '12px 10px', marginBottom: '20px', border: '1px solid #455a64', borderRadius: '5px', fontSize: '1em', backgroundColor: '#fff', color: '#333' }} />
            
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#FFB703', color: '#023047', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                {userType === 'cliente' ? 'Finalizar Cadastro' : 'Próxima Etapa (Chave)'}
            </button>
        </form>
    );
    

    return (
        <div style={{ /* ... estilos externos ... */ }}>
            {/* CONTAINER CENTRAL (QUADRO AZUL) */}
            <div style={{ /* ... estilos do quadro azul ... */ }}>
                
                <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                    <img src={barberLogo} alt="BarberApp Logo" style={{ width: '90%', height: 'auto', margin: '0 0 15px 0' }} />
                </div>

                {/* Renderiza a Etapa 2 ou a Etapa 1 */}
                {registrationStep === 2 ? renderActivationForm() : renderRegistrationForm()}
                
                {/* Mensagens e Link de Login */}
                {message && (
                    <p style={{ marginTop: '20px', color: message.includes('sucesso') ? '#90ee90' : '#ff9999', fontWeight: 'bold', fontSize: '0.9em' }}>
                        {message}
                    </p>
                )}
                
                <p style={{ marginTop: '30px', fontSize: '0.9em', borderTop: '1px solid #455a64', padding: '10px 0 0 0' }}>
                    <Link to="/login" style={{ color: '#FFB703', textDecoration: 'none', fontWeight: 'bold' }}>
                        Já tem conta? Faça Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;