// src/components/Configuracoes/ExclusaoConta.jsx (NOVO ARQUIVO)
import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useUi } from '../../contexts/UiContext';
import { FaTrashAlt } from 'react-icons/fa';

const ExclusaoConta = () => {
    const { logout } = useAuth();
    const ui = useUi();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleDelete = async () => {
        // Confirmação de segurança dupla (CRÍTICO)
        const ok = await ui.confirm('ATENÇÃO: A exclusão é permanente! Todos os seus dados (agendamentos, transações) serão perdidos. Tem certeza que deseja prosseguir?');
        if (!ok) return;

        setLoading(true);
        setMessage('');

        try {
            // Chama a nova API DELETE /auth/delete-account
            await api.delete('/auth/delete-account');

            ui.showPostIt('Sua conta foi excluída com sucesso.', 'success');
            // OBRIGATÓRIO: Limpar o token e forçar o logout após a exclusão
            setTimeout(() => {
                logout(); 
            }, 1500);

        } catch (error) {
            console.error('Erro ao excluir conta:', error.response?.data);
            const errMsg = error.response?.data?.error || 'Falha ao excluir. Verifique se o servidor está rodando.';
            ui.showPostIt(errMsg, 'error');
            setMessage(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ffcccc', borderRadius: '8px', maxWidth: '600px', margin: '20px auto', backgroundColor: '#fff0f0' }}>
            <h2 style={{ color: '#cc0000' }}>Excluir Minha Conta</h2>
            <p>Se você deseja desativar permanentemente sua conta e remover todos os seus dados do sistema, clique no botão abaixo.</p>
            
            <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '5px', padding: '15px', marginBottom: '15px' }}>
                <p style={{ margin: 0, color: '#856404', fontSize: '0.95em' }}>
                    <strong>⚠️ Atenção:</strong> Você só pode excluir sua conta se:
                    <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                        <li>Não houver agendamentos pendentes (conclua ou cancele todos)</li>
                        <li>Não houver transações pendentes (para barbeiros)</li>
                        <li>Você pode manter horários e serviços cadastrados</li>
                    </ul>
                </p>
            </div>
            
            <button 
                onClick={handleDelete} 
                disabled={loading}
                style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#cc0000', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                {loading ? 'Excluindo...' : <><FaTrashAlt style={{marginRight: '5px'}}/> Excluir Permanentemente</>}
            </button>
            
            {message && <p style={{ marginTop: '15px', color: message.includes('sucesso') ? 'green' : 'red' }}>{message}</p>}
        </div>
    );
};

export default ExclusaoConta;