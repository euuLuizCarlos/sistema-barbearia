// src/components/Agendamento/ListaAgendamentos.jsx (VERSÃO ATUALIZADA)

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api'; 
import { FaUser, FaClock, FaCut, FaDollarSign, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

const ListaAgendamentos = ({ refreshKey }) => {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Funções de Estilo (para o Status)
    const getStatusStyle = (status) => {
        switch (status) {
            case 'concluido': return { color: 'white', backgroundColor: 'green', label: 'CONCLUÍDO' };
            case 'cancelado': return { color: 'white', backgroundColor: 'red', label: 'CANCELADO' };
            case 'agendado': 
            default: return { color: 'black', backgroundColor: '#FFB703', label: 'AGENDADO' };
        }
    };
    
    // Função para buscar os agendamentos do barbeiro logado
    const fetchAgendamentos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/agendamentos'); 
            setAgendamentos(response.data);
        } catch (error) {
            console.error("Erro ao buscar agendamentos:", error);
            setError(error.response?.data?.error || 'Erro ao carregar a agenda. Verifique o backend.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos, refreshKey]); 

    
    // ---------------------------------------------
    // FUNÇÕES DE AÇÃO
    // ---------------------------------------------

    // Função para atualizar o status do agendamento no backend
    const updateAgendamentoStatus = async (agendamentoId, newStatus, successMessage) => {
        try {
            await api.put(`/agendamentos/${agendamentoId}/status`, { status: newStatus });
            alert(successMessage);
            fetchAgendamentos(); // Recarrega a lista para refletir a mudança
        } catch (error) {
            console.error(`Erro ao tentar ${newStatus} agendamento:`, error);
            alert(`Falha ao ${newStatus} o agendamento: ${error.response?.data?.error || 'Erro de conexão.'}`);
        }
    };

    // FUNÇÃO PARA CANCELAR AGENDAMENTO
    const handleCancelarAgendamento = (agendamentoId) => {
        if(window.confirm(`Tem certeza que deseja CANCELAR o agendamento ID ${agendamentoId}? Esta ação é irreversível.`)) {
            updateAgendamentoStatus(agendamentoId, 'cancelado', `Agendamento ${agendamentoId} CANCELADO com sucesso.`);
        }
    };

    // FUNÇÃO PARA CONCLUIR/CONFIRMAR AGENDAMENTO (Próxima etapa: Fechamento de Caixa)
    const handleConcluirAgendamento = (agendamentoId) => {
        // Por agora, vamos apenas marcar como 'concluido'. 
        // Na próxima e última etapa, isso abrirá um modal de Fechamento de Caixa.
        if(window.confirm(`Confirmar que o agendamento ID ${agendamentoId} foi CONCLUÍDO e o pagamento será registrado?`)) {
            updateAgendamentoStatus(agendamentoId, 'concluido', `Agendamento ${agendamentoId} CONCLUÍDO. PRÓXIMO PASSO: Integração com o Caixa!`);
        }
    };
    
    // ---------------------------------------------
    // RENDERIZAÇÃO (Mantida a mesma estrutura)
    // ---------------------------------------------

    if (loading) {
        return <h2 style={{ textAlign: 'center', padding: '50px' }}><FaSpinner className="spinner" /> Carregando Agenda...</h2>;
    }
    
    if (error) {
        return <h2 style={{ color: 'red', padding: '20px' }}>Erro: {error}</h2>;
    }

    if (agendamentos.length === 0) {
        return <p style={{ marginTop: '20px', fontSize: '1.2em' }}>Nenhum agendamento futuro encontrado para você.</p>;
    }
    
    return (
        <div style={{ padding: '0px' }}>
            <h2 style={{ color: '#555', marginBottom: '20px' }}>Agendamentos Futuros: {agendamentos.length}</h2>
            
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {agendamentos.map(a => {
                    const statusInfo = getStatusStyle(a.status);
                    const dataInicio = new Date(a.data_hora_inicio);
                    const dataFim = new Date(a.data_hora_fim);

                    return (
                        <li key={a.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
                            
                            {/* LINHA 1: HORÁRIO E STATUS */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, color: '#023047', display: 'flex', alignItems: 'center' }}>
                                    <FaClock style={{ marginRight: '8px' }} />
                                    {dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} | {dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {dataFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </h3>
                                <span style={{ ...statusInfo, padding: '5px 10px', fontWeight: 'bold' }}>
                                    {statusInfo.label}
                                </span>
                            </div>

                            {/* LINHA 2: DETALHES PRINCIPAIS */}
                            <p style={{ margin: '5px 0' }}><FaUser style={{ marginRight: '5px' }}/> Cliente: **{a.nome_cliente}**</p>
                            <p style={{ margin: '5px 0' }}><FaCut style={{ marginRight: '5px' }}/> Serviço: **{a.nome_servico}**</p>
                            <p style={{ margin: '5px 0' }}><FaDollarSign style={{ marginRight: '5px', color: 'green' }}/> Valor Base: **R$ {parseFloat(a.valor_servico).toFixed(2)}**</p>
                            
                            {/* LINHA 3: OBSERVAÇÕES DO CLIENTE */}
                            {(a.observacao || a.preferencia) && (
                                <div style={{ borderTop: '1px dashed #eee', paddingTop: '10px', marginTop: '15px', fontSize: '0.9em', color: '#777' }}>
                                    {a.observacao && <p style={{ margin: '0' }}>**Obs:** {a.observacao}</p>}
                                    {a.preferencia && <p style={{ margin: '0' }}>**Preferencia:** {a.preferencia}</p>}
                                </div>
                            )}

                            {/* LINHA 4: BOTÕES DE AÇÃO (Apenas se 'agendado') */}
                            {a.status === 'agendado' && (
                                <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                                    <button 
                                        onClick={() => handleConcluirAgendamento(a.id)}
                                        style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}
                                    >
                                        <FaCheck style={{ marginRight: '5px' }} />
                                        Concluir (Pagamento)
                                    </button>
                                    <button 
                                        onClick={() => handleCancelarAgendamento(a.id)}
                                        style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        <FaTimes style={{ marginRight: '5px' }} />
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
};

export default ListaAgendamentos;