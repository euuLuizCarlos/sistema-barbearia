// src/pages/MeusAgendamentos.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useUi } from '../contexts/UiContext';
import { FaCalendarCheck, FaClock, FaDollarSign, FaUserCircle, FaSpinner, FaTimes, FaStar, FaUserTie, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
// Importar o Modal de Avaliação do Barbeiro (Certifique-se de que este arquivo existe no caminho)
import ModalAvaliacaoBarbeiro from '../components/Auth/ModalAvaliacaoBarbeiro'; 


// =======================================================
// DEFINIÇÕES DE CORES LOCAIS 
// =======================================================
const COLORS = {
    PRIMARY: '#023047',
    ACCENT: '#FFB703',
    SUCCESS: '#4CAF50',
    ERROR: '#cc0000',
    SECONDARY_TEXT: '#888888',
};


const MeusAgendamentos = () => {
    const { user } = useAuth();
    const ui = useUi();
    const navigate = useNavigate();
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // ESTADO PARA DISPARAR O MODAL DE AVALIAÇÃO DO BARBEIRO
    const [agendamentoToReview, setAgendamentoToReview] = useState(null);

    const clienteId = user?.userId;

    // --- FUNÇÃO DE BUSCA DOS AGENDAMENTOS (Incluindo status de avaliação) ---
    const fetchAgendamentos = useCallback(async () => {
        if (user?.userType !== 'cliente' || !clienteId) {
            setError("Acesso negado. Esta página é exclusiva para clientes logados.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError('');

        try {
            // Rota GET /agendamentos/cliente/:clienteId (O backend DEVE retornar a coluna 'nota_barbeiro_cliente')
            const response = await api.get(`/agendamentos/cliente/${clienteId}`);
            setAgendamentos(response.data);
            
        } catch (err) {
            console.error("Erro ao buscar agendamentos do cliente:", err);
            setError(err.response?.data?.error || "Falha ao carregar seus agendamentos.");
        } finally {
            setLoading(false);
        }
    }, [clienteId, user?.userType]);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);
    
    
    // --- FUNÇÕES AUXILIARES ---

    const formatDateTime = (dateTime) => {
        const date = new Date(dateTime);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'concluido': return { color: 'white', backgroundColor: COLORS.SUCCESS, label: 'CONCLUÍDO' };
            case 'cancelado': return { color: 'white', backgroundColor: COLORS.ERROR, label: 'CANCELADO' };
            default: return { color: 'black', backgroundColor: COLORS.ACCENT, label: 'AGENDADO' };
        }
    };
    
    // 💡 FUNÇÃO PARA VERIFICAR SE O BARBEIRO FOI AVALIADO NESTE AGENDAMENTO
    const wasReviewed = (agendamento) => {
        // A coluna 'nota_barbeiro_cliente' deve vir preenchida (com a nota) se já foi avaliado.
        // Se for null/undefined, significa que a avaliação está pendente.
        return agendamento.nota_barbeiro_cliente !== undefined && agendamento.nota_barbeiro_cliente !== null;
    };


    // --- HANDLERS DE AÇÃO ---
    
    const handleCancel = async (agendamentoId) => {
        const ok = await ui.confirm('Tem certeza que deseja CANCELAR este agendamento?');
        if (!ok) return;

        const motivo = await ui.prompt('Por favor, digite o motivo do cancelamento:');
        if (!motivo) {
            ui.showPostIt('Cancelamento abortado. O motivo é obrigatório.', 'error');
            return;
        }

        try {
            await api.put(`/agendamentos/${agendamentoId}/status`, { status: 'cancelado', motivo: motivo });
            ui.showPostIt('Agendamento cancelado com sucesso!', 'success');
            fetchAgendamentos();
        } catch (error) {
            ui.showPostIt(error.response?.data?.error || 'Falha ao cancelar. Tente novamente.', 'error');
        }
    };
    
    // Inicia o fluxo de avaliação
    const handleStartReview = (agendamento) => {
        setAgendamentoToReview(agendamento);
    };

    // Chamado após o cliente submeter a avaliação no modal
    const handleReviewCompleted = () => {
        setAgendamentoToReview(null); // Fecha o modal
        fetchAgendamentos(); // Recarrega para que o botão "Avaliar" desapareça
    };


    // --- LÓGICA DE RENDERIZAÇÃO ---
    
    if (loading) {
        return <h1 style={{ padding: '50px', textAlign: 'center' }}><FaSpinner className="spinner" /> Carregando agendamentos...</h1>;
    }

    if (error) {
        return <h1 style={{ padding: '50px', color: COLORS.ERROR }}>{error}</h1>;
    }
    
    // Sort logic: Prioriza agendamentos futuros (0), depois concluídos não avaliados (1), e por fim, os demais (2).
    const sortedAgendamentos = [...(agendamentos || [])].sort((x, y) => {
        const xReviewed = wasReviewed(x);
        const yReviewed = wasReviewed(y);
        
        // 0: Agendado; 1: Concluído (Não Avaliado); 2: Concluído/Cancelado (Finalizado)
        const getPriority = (item) => {
            if (item.status === 'agendado') return 0;
            if (item.status === 'concluido' && !wasReviewed(item)) return 1;
            return 2;
        };
        
        const xStatus = getPriority(x);
        const yStatus = getPriority(y);
        
        if (xStatus !== yStatus) return xStatus - yStatus;
        return new Date(x.data_hora_inicio) - new Date(y.data_hora_inicio);
    });

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h1 style={{ color: COLORS.PRIMARY, borderBottom: `2px solid ${COLORS.ACCENT}`, paddingBottom: '10px' }}>
                <FaCalendarCheck style={{ marginRight: '10px' }}/> Meus Agendamentos
            </h1>

            {sortedAgendamentos.length === 0 ? (
                <p style={{ marginTop: '20px', fontSize: '1.2em' }}>Você ainda não possui agendamentos.</p>
            ) : (
                <div style={{ marginTop: '20px' }}>
                    {sortedAgendamentos.map(ag => {
                        const isPending = ag.status === 'agendado';
                        const isCompleted = ag.status === 'concluido';
                        const needsReview = isCompleted && !wasReviewed(ag);
                        const statusInfo = getStatusStyle(ag.status);

                        return (
                            <div key={ag.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: needsReview ? '#fffae6' : (isPending ? '#f0fff4' : '#fff') }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, color: COLORS.PRIMARY }}>{ag.nome_servico || 'Serviço'}</h3>
                                    <span style={{ ...statusInfo, padding: '5px 10px', borderRadius: '4px' }}>{statusInfo.label}</span>
                                </div>
                                
                                <p style={{ margin: '10px 0 5px 0' }}><FaUserCircle style={{ marginRight: '5px'}}/> Barbeiro: **{ag.nome_barbeiro}**</p>
                                <p style={{ margin: '5px 0' }}><FaClock style={{ marginRight: '5px'}}/> Horário: **{formatDateTime(ag.data_hora_inicio)}**</p>
                                <p style={{ margin: '5px 0' }}><FaDollarSign style={{ marginRight: '5px', color: COLORS.SUCCESS }}/> Valor: **R$ {parseFloat(ag.valor_servico).toFixed(2)}**</p>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
                                    <button
                                        onClick={() => navigate(`/barbearia/${ag.barbeiro_id}`)}
                                        style={{ padding: '10px 16px', backgroundColor: COLORS.ACCENT, color: COLORS.PRIMARY, border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}
                                    >
                                        Ver Detalhes da Barbearia
                                    </button>
                                </div>

                                {/* MOTIVO DE CANCELAMENTO (EXIBIDO PARA O CLIENTE) */}
                                {ag.status === 'cancelado' && ag.motivo_cancelamento && (
                                    <div style={{ 
                                        margin: '10px 0 0 0', 
                                        color: COLORS.ERROR, 
                                        borderLeft: `3px solid ${COLORS.ERROR}`, 
                                        backgroundColor: '#ffe6e6',
                                        padding: '10px',
                                        borderRadius: '4px'
                                    }}>
                                        <p style={{ margin: '0 0 5px 0', fontStyle: 'italic' }}>
                                            Motivo: {ag.motivo_cancelamento}
                                        </p>
                                        {ag.cancelado_por && (
                                            <p style={{ margin: '0', fontSize: '0.9em' }}>
                                                Cancelado por: {ag.cancelado_por}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* AVALIAÇÃO E AÇÃO */}
                                {needsReview && (
                                    <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ffb70366' }}>
                                        <button 
                                            onClick={() => handleStartReview(ag)}
                                            style={{ padding: '10px 20px', backgroundColor: COLORS.ACCENT, color: COLORS.PRIMARY, border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            <FaStar style={{ marginRight: '5px' }} />
                                            Avaliar Barbeiro/Serviço
                                        </button>
                                    </div>
                                )}
                                
                                {wasReviewed(ag) && (
                                    <p style={{ marginTop: '15px', color: COLORS.SUCCESS, fontWeight: 'bold' }}>
                                        <FaCheck style={{ marginRight: '5px'}}/> Avaliação concluída (Nota: {ag.nota_barbeiro_cliente}).
                                    </p>
                                )}
                                
                                {/* BOTÕES PADRÃO (APENAS PARA AGENDAMENTOS FUTUROS PENDENTES) */}
                                {isPending && (
                                    <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                                        <button 
                                            onClick={() => handleCancel(ag.id)}
                                            style={{ padding: '10px 20px', backgroundColor: COLORS.ERROR, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            <FaTimes style={{ marginRight: '5px' }} />
                                            Cancelar Agendamento
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* 🚨 RENDERIZAÇÃO DO MODAL DE AVALIAÇÃO DO BARBEIRO 🚨 */}
            {agendamentoToReview && (
                <ModalAvaliacaoBarbeiro 
                    agendamento={agendamentoToReview}
                    onAvaliacaoConcluida={handleReviewCompleted}
                />
            )}
        </div>
    );
};

export default MeusAgendamentos;