// src/components/Auth/ModalAvaliacaoBarbeiro.jsx (CÓDIGO OTIMIZADO)

import React, { useState } from 'react';
import api from '../../services/api';
import { FaStar, FaUserTie, FaTimes, FaSpinner, FaCalendarCheck } from 'react-icons/fa';
import { useUi } from '../../contexts/UiContext';

const COLORS = {
    PRIMARY: '#023047',
    ACCENT: '#FFB703',
    SUCCESS: '#4CAF50',
    SECONDARY_TEXT: '#888888',
};


const ModalAvaliacaoBarbeiro = ({ agendamento, onAvaliacaoConcluida }) => {
    const ui = useUi();
    const [nota, setNota] = useState(5);
    const [observacao, setObservacao] = useState('');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(''); // Novo estado para erro local

    if (!agendamento) return null;

    const renderStars = (currentRating) => {
        return [1, 2, 3, 4, 5].map(star => (
            <FaStar 
                key={star} 
                size={30} 
                onClick={() => setNota(star)} 
                style={{ cursor: 'pointer', color: star <= currentRating ? COLORS.ACCENT : COLORS.SECONDARY_TEXT, transition: 'color 0.2s' }}
            />
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError('');

        try {
            // Chama a rota POST /avaliar-barbeiro
            const response = await api.post('/avaliar-barbeiro', {
                agendamento_id: agendamento.id,
                nota: nota,
                observacao: observacao || null // Garante que observação seja null se vazia
            });

            ui.showPostIt(response.data.message || `Sua avaliação foi registrada!`, 'success');
            
            // 🚨 SOLUÇÃO PARA O ERRO: Chamamos a função de conclusão para fechar o modal e recarregar a lista.
            onAvaliacaoConcluida(); 

        } catch (error) {
            console.error("Erro ao enviar avaliação:", error.response?.data);
            const errMsg = error.response?.data?.error || 'Falha ao registrar avaliação.';
            setLocalError(errMsg);
            ui.showPostIt(errMsg, 'error');
            setLoading(false); // Mantemos o modal aberto em caso de erro para permitir nova tentativa
        }
    };
    
    // NOTA: Removendo o onClick={onClose} do div principal para garantir que
    // o modal só feche após a conclusão bem-sucedida, usando o handler do botão.

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
            <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '500px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', textAlign: 'center' }}>

                <h2 style={{ color: COLORS.PRIMARY, borderBottom: `2px solid ${COLORS.ACCENT}`, paddingBottom: '10px', marginBottom: '20px' }}>
                    Avalie o seu Barbeiro!
                </h2>
                <p style={{ color: COLORS.SECONDARY_TEXT, marginBottom: '20px' }}>
                    Seu feedback sobre o serviço de **{agendamento.nome_servico}** com **{agendamento.nome_barbeiro}** é muito importante.
                </p>

                <div style={{ margin: '30px 0', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                    {renderStars(nota)}
                </div>

                <label style={{ display: 'block', fontWeight: 'bold', color: COLORS.PRIMARY, marginBottom: '5px' }}>Observações (Opcional):</label>
                <textarea
                    rows="3"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Deixe um comentário sobre o atendimento, pontualidade, etc."
                    style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.PRIMARY}`, borderRadius: '5px', resize: 'none', marginBottom: '10px' }}
                    disabled={loading}
                />
                
                {localError && <p style={{ color: COLORS.ERROR, fontSize: '0.9em', marginBottom: '15px' }}>{localError}</p>}


                <button 
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', backgroundColor: COLORS.SUCCESS, color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', marginBottom: '10px' }}
                >
                    {loading ? <FaSpinner className="spinner" /> : <><FaCalendarCheck style={{ marginRight: '5px'}}/> Enviar Avaliação</>}
                </button>
                
                <button 
                    type="button" 
                    onClick={onAvaliacaoConcluida} // Usamos a mesma função para fechar/cancelar
                    style={{ background: 'none', border: 'none', color: COLORS.SECONDARY_TEXT, cursor: 'pointer' }}
                    disabled={loading}
                >
                    <FaTimes style={{ marginRight: '5px'}}/> Deixar para depois
                </button>
                
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
            </form>
        </div>
    );
};

export default ModalAvaliacaoBarbeiro;