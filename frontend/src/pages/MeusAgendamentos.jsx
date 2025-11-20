// src/pages/MeusAgendamentos.jsx (ATUALIZADO COM FUNÇÃO DE CANCELAMENTO)

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useUi } from '../contexts/UiContext';
import { FaCalendarCheck, FaClock, FaDollarSign, FaUserCircle, FaSpinner, FaTimes } from 'react-icons/fa';

const MeusAgendamentos = () => {
    const { user } = useAuth();
    const ui = useUi();
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const clienteId = user?.userId;

    const fetchAgendamentos = useCallback(async () => {
        if (user?.userType !== 'cliente' || !clienteId) {
            setError("Acesso negado. Esta página é exclusiva para clientes logados.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError('');

        try {
            // Rota: /agendamentos/cliente/:clienteId
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
    
    // --- FUNÇÃO DE CANCELAMENTO (USA ROTA PUT /agendamentos/:id/status) ---
    const handleCancel = async (agendamentoId) => {
        const ok = await ui.confirm('Tem certeza que deseja CANCELAR este agendamento?');
        if (!ok) return;

        const motivo = await ui.prompt('Por favor, digite o motivo do cancelamento:');
        if (!motivo) {
            ui.showPostIt('Cancelamento abortado. O motivo é obrigatório.', 'error');
            return;
        }

        try {
            await api.put(`/agendamentos/${agendamentoId}/status`, {
                status: 'cancelado',
                motivo: motivo
            });
            ui.showPostIt('Agendamento cancelado com sucesso!', 'success');
            fetchAgendamentos();
        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            ui.showPostIt(error.response?.data?.error || 'Falha ao cancelar. Tente novamente.', 'error');
        }
    };
    
    // Funções de formatação e estilo (mantidas)
    const formatDateTime = (dateTime) => {
        const date = new Date(dateTime);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'concluido': return { color: 'white', backgroundColor: 'green', label: 'CONCLUÍDO' };
            case 'cancelado': return { color: 'white', backgroundColor: 'red', label: 'CANCELADO' };
            case 'agendado': 
            default: return { color: 'black', backgroundColor: '#FFB703', label: 'AGENDADO' };
        }
    };
    
    // LÓGICA DE RENDERIZAÇÃO
    if (loading) {
        return <h1 style={{ padding: '50px', textAlign: 'center' }}><FaSpinner className="spinner" /> Carregando agendamentos...</h1>;
    }

    if (error) {
        return <h1 style={{ padding: '50px', color: 'red' }}>{error}</h1>;
    }
    
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h1 style={{ color: '#023047', borderBottom: '2px solid #FFB703', paddingBottom: '10px' }}>
                <FaCalendarCheck style={{ marginRight: '10px' }}/> Meus Agendamentos
            </h1>

            {agendamentos.length === 0 ? (
                <p style={{ marginTop: '20px', fontSize: '1.2em' }}>Você ainda não possui agendamentos ativos. Agende seu próximo serviço!</p>
            ) : (
                <div style={{ marginTop: '20px' }}>
                    {/** Ordena: pendentes ('agendado') primeiro por data/hora asc, depois os demais também por data/hora asc */}
                    {([...(agendamentos || [])].sort((x, y) => {
                        const px = x.status === 'agendado' ? 0 : 1;
                        const py = y.status === 'agendado' ? 0 : 1;
                        if (px !== py) return px - py;
                        return new Date(x.data_hora_inicio) - new Date(y.data_hora_inicio);
                    })).map(ag => {
                        const isPending = ag.status === 'agendado';
                        const statusInfo = getStatusStyle(ag.status);

                        return (
                            <div key={ag.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: isPending ? '#f0fff4' : '#fff' }}>
                                
                                {/* LINHA 1: Destaque */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, color: '#023047' }}>{ag.nome_servico || 'Serviço'}</h3>
                                    <span style={getStatusStyle(ag.status)}>{statusInfo.label}</span>
                                </div>
                                
                                {/* LINHA 2: Detalhes */}
                                <p style={{ margin: '10px 0 5px 0' }}>
                                    <FaUserCircle style={{ marginRight: '5px' }}/> Barbeiro: **{ag.nome_barbeiro}**
                                </p>
                                <p style={{ margin: '5px 0' }}>
                                    <FaClock style={{ marginRight: '5px' }}/> Horário: **{formatDateTime(ag.data_hora_inicio)}**
                                </p>
                                <p style={{ margin: '5px 0' }}>
                                    <FaDollarSign style={{ marginRight: '5px', color: 'green' }}/> Valor: **R$ {parseFloat(ag.valor_servico).toFixed(2)}**
                                </p>
                                {/* MOSTRA MOTIVO E QUEM CANCELou (se aplicável) */}
                                {ag.status === 'cancelado' && (ag.motivo_cancelamento || ag.cancelado_por) && (
                                    <div style={{ marginTop: '10px', color: 'darkred', fontStyle: 'italic', borderLeft: '3px solid red', paddingLeft: '10px' }}>
                                        {ag.motivo_cancelamento && <p style={{ margin: 0 }}>Motivo: {ag.motivo_cancelamento}</p>}
                                        {ag.cancelado_por && (
                                            <p style={{ margin: 0 }}>Cancelado por: <strong>{ag.cancelado_por === 'barbeiro' ? 'Barbeiro' : ag.cancelado_por === 'cliente' ? 'Cliente' : ag.cancelado_por}</strong></p>
                                        )}
                                    </div>
                                )}
                                {/* BOTÃO DE CANCELAR (SÓ SE O STATUS FOR 'agendado') */}
                                {isPending && (
                                    <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                                        <button 
                                            onClick={() => handleCancel(ag.id)}
                                            style={{ 
                                                padding: '10px 20px', 
                                                backgroundColor: 'red', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '5px', 
                                                cursor: 'pointer', 
                                                fontWeight: 'bold', 
                                            }}
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
        </div>
    );
};

export default MeusAgendamentos;