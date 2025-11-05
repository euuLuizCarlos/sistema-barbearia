// src/pages/AtivacaoConta.jsx (CÓDIGO FINAL E COMPLETO - CORRIGINDO O ERRO 400)
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
// Verifique o nome real do seu arquivo de logo
import barberLogo from '../assets/Gemini_Generated_Image_lkroqflkroqflkro.png'; 

const AtivacaoConta = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    
    // CAPTURA O ID DO USUÁRIO DA URL
    const userId = queryParams.get('userId'); 

    const [chaveAcesso, setChaveAcesso] = useState('');
    const [message, setMessage] = useState('');
    
    // 1. EFEITO DE GUARDA: Redirecionamento de segurança se o ID for nulo
    useEffect(() => {
        if (!userId) {
            // Se não há ID, mostra erro e redireciona para que o usuário possa logar/registrar novamente.
            setMessage('Erro: ID do usuário ausente. Por favor, faça login novamente.');
            // Dá tempo para o usuário ler a mensagem antes de redirecionar
            setTimeout(() => navigate('/login'), 3000); 
        }
    }, [userId, navigate]);

    const handleActivation = async (e) => {
        e.preventDefault();
        setMessage('Verificando chave...');
        
        // 2. PROTEÇÃO DE ENVIO: Não envia requisição inválida.
        if (!userId) {
            setMessage('Erro: A ativação não pode ser processada. Tente logar novamente.');
            return;
        }

       try {
            // CORREÇÃO: Removemos o parseInt()
            const response = await api.post('/auth/ativar-conta', { 
                userId: userId, // Passa o ID como string
                chaveAcesso: chaveAcesso 
            });

            setMessage(response.data.message + ' Redirecionando para o Login...');
            
            // Sucesso: Manda para o Login
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Erro ao comunicar com o servidor.';
            setMessage(errorMessage);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#FFFFFF', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
            <div style={{ 
                backgroundColor: '#023047', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                maxWidth: '550px', width: '100%', boxSizing: 'border-box', color: '#fff' 
            }}>
                
                <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                    <img src={barberLogo} alt="Logo" style={{ width: '90%', height: 'auto', margin: '0 0 15px 0' }} />
                    <h2 style={{ color: '#FFB703' }}>Ativação de Conta Barbeiro</h2>
                    
                    {userId ? (
                        <p style={{ margin: '5px 0 0 0', color: '#ccc' }}>Insira a Chave Mestra para liberar o acesso ao sistema.</p>
                    ) : (
                        <p style={{ margin: '5px 0 0 0', color: '#ff9999', fontWeight: 'bold' }}>
                            Aguardando ID do usuário...
                        </p>
                    )}
                </div>

                <form onSubmit={handleActivation}>
                    <input
                        type="text"
                        value={chaveAcesso}
                        onChange={(e) => setChaveAcesso(e.target.value)}
                        placeholder="CHAVE-DE-ACESSO-MESTRA"
                        required
                        style={{ width: '100%', padding: '12px 10px', marginBottom: '20px', border: '1px solid #455a64', borderRadius: '5px', fontSize: '1em', backgroundColor: '#fff', color: '#333' }}
                        disabled={!userId} // Desabilita o campo se não houver ID
                    />
                    <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#FFB703', color: '#023047', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }} disabled={!userId}>
                        Ativar Conta
                    </button>
                </form>

                {message && (
                    <p style={{ marginTop: '20px', color: message.includes('sucesso') ? '#90ee90' : '#ff9999', fontWeight: 'bold' }}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default AtivacaoConta;