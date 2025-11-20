// src/components/Agendamento/ListaAgendamentos.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api'; 
import { FaUser, FaClock, FaCut, FaDollarSign, FaCheck, FaTimes, FaSpinner, FaSearch } from 'react-icons/fa';
import ModalFechamentoComanda from './ModalFechamentoComanda';
import { useUi } from '../../contexts/UiContext'; 

const ListaAgendamentos = ({ refreshKey }) => {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estado para a Pesquisa por Data
    const [dataPesquisa, setDataPesquisa] = useState(''); 
    
    // Estado para o Modal de Fechamento de Comanda
    const [agendamentoToClose, setAgendamentoToClose] = useState(null); 

    // Funções de Estilo (para o Status)
    const getStatusStyle = (status) => {
        switch (status) {
            case 'concluido': return { color: 'white', backgroundColor: 'green', label: 'CONCLUÍDO' };
            case 'cancelado': return { color: 'white', backgroundColor: 'red', label: 'CANCELADO' };
            case 'agendado': 
            default: return { color: 'black', backgroundColor: '#FFB703', label: 'AGENDADO' };
        }
    };
    
    // Função para buscar os agendamentos (Modificada para usar dataPesquisa)
    const fetchAgendamentos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Define a URL baseada na presença do filtro de data
            let url = dataPesquisa ? `/agendamentos/data?data=${dataPesquisa}` : '/agendamentos';
            
            const response = await api.get(url); 
            setAgendamentos(response.data);
        } catch (error) {
            console.error("Erro ao buscar agendamentos:", error);
            setError(error.response?.data?.error || 'Erro ao carregar a agenda. Verifique o backend.');
        } finally {
            setLoading(false);
        }
    }, [dataPesquisa]); // Dispara a busca quando a data muda

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos, refreshKey]); 

    
    // ---------------------------------------------
    // FUNÇÕES DE AÇÃO
    // ---------------------------------------------

    const ui = useUi();

    // FUNÇÃO PARA CANCELAR AGENDAMENTO (COM MOTIVO)
    const handleCancelarAgendamento = async (agendamentoId) => {
        const ok = await ui.confirm(`Tem certeza que deseja CANCELAR o agendamento ID ${agendamentoId}?`);
        if (!ok) return;

        const motivo = await ui.prompt('Por favor, digite o motivo do cancelamento (Obrigatório):');
        if (!motivo) {
            ui.showPostIt('Cancelamento abortado. O motivo é obrigatório.', 'error');
            return;
        }

        try {
            await api.put(`/agendamentos/${agendamentoId}/status`, {
                status: 'cancelado',
                motivo: motivo
            });
            ui.showPostIt(`Agendamento ${agendamentoId} CANCELADO com sucesso.`, 'success');
            fetchAgendamentos();
        } catch (error) {
            console.error(`Erro ao cancelar agendamento:`, error);
            ui.showPostIt(error.response?.data?.error || 'Falha ao cancelar. Tente novamente.', 'error');
        }
    };

    // FUNÇÃO PARA ABRIR O MODAL DE FECHAMENTO
    const handleConcluirAgendamento = (agendamento) => {
        setAgendamentoToClose(agendamento);
    };

    // Função chamada após o sucesso do fechamento dentro do Modal
    const handleFechamentoSuccess = (message) => {
        setAgendamentoToClose(null); // Fecha o modal
        ui.showPostIt(message, 'success');
        fetchAgendamentos(); // Recarrega a lista
    };
    
    // ---------------------------------------------
    // RENDERIZAÇÃO
    // ---------------------------------------------

    if (loading) {
        return <h2 style={{ textAlign: 'center', padding: '50px' }}><FaSpinner className="spinner" /> Carregando Agenda...</h2>;
    }
    
    if (error) {
        return <h2 style={{ color: 'red', padding: '20px' }}>Erro: {error}</h2>;
    }

    const valorTotalAgendamentos = agendamentos.reduce((acc, a) => acc + parseFloat(a.valor_servico || 0), 0);

    return (
        <div style={{ padding: '0px' }}>
            
            {/* CAMPO DE PESQUISA POR DATA */}
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    <FaSearch style={{ marginRight: '5px' }}/> Pesquisar por Data Específica:
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={dataPesquisa}
                        onChange={(e) => setDataPesquisa(e.target.value)}
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', flexGrow: 1 }}
                    />
                    <button
                        onClick={() => setDataPesquisa('')} 
                        disabled={!dataPesquisa}
                        style={{ padding: '10px 15px', backgroundColor: '#ccc', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Limpar Filtro
                    </button>
                </div>
                {dataPesquisa && (
                    <p style={{ marginTop: '10px', color: '#023047', fontWeight: 'bold' }}>
                        * Exibindo agendamentos para {dataPesquisa}.
                    </p>
                )}
            </div>
            
            <h2 style={{ color: '#555', marginBottom: '10px' }}>
                {dataPesquisa ? 'Agendamentos Encontrados' : 'Próximos Agendamentos Futuros'}
            </h2>
            <p style={{ marginBottom: '20px', fontWeight: 'bold' }}>
                Total de Agendamentos: {agendamentos.length} | 
                Valor Total (Base): R$ {valorTotalAgendamentos.toFixed(2)}
            </p>

            {agendamentos.length === 0 ? (
                <p style={{ marginTop: '20px', fontSize: '1.2em' }}>Nenhum agendamento encontrado para o filtro atual.</p>
            ) : (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {/** Ordena: primeiro agendados (pendentes) por data/hora ascendente, depois os demais também por data/hora ascendente */}
                    {([...(agendamentos || [])].sort((x, y) => {
                        const px = x.status === 'agendado' ? 0 : 1;
                        const py = y.status === 'agendado' ? 0 : 1;
                        if (px !== py) return px - py;
                        return new Date(x.data_hora_inicio) - new Date(y.data_hora_inicio);
                    })).map(a => {
                        const statusInfo = getStatusStyle(a.status);
                        const dataInicio = new Date(a.data_hora_inicio);
                        const dataFim = new Date(a.data_hora_fim);
                        const valorFormatado = parseFloat(a.valor_servico || 0).toFixed(2);
                        const isPending = a.status === 'agendado';

                        return (
                            <li key={a.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: isPending ? '#f0fff4' : '#fff' }}>
                                
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
                                <p style={{ margin: '5px 0' }}><FaDollarSign style={{ marginRight: '5px', color: 'green' }}/> Valor Base: **R$ {valorFormatado}**</p>
                                
                                {/* NOVIDADE: EXIBIÇÃO DO MOTIVO DE CANCELAMENTO */}
                                {a.status === 'cancelado' && a.motivo_cancelamento && (
                                    <p style={{ 
                                        margin: '10px 0 0 0', 
                                        color: 'darkred', 
                                        fontStyle: 'italic', 
                                        fontSize: '0.9em', 
                                        borderLeft: '3px solid red', 
                                        paddingLeft: '10px' 
                                    }}>
                                        Motivo: {a.motivo_cancelamento}
                                    </p>
                                )}
                                {a.status === 'cancelado' && a.cancelado_por && (
                                    <p style={{ margin: '6px 0 0 0', fontSize: '0.9em', color: '#a00' }}>
                                        Cancelado por: <strong>{a.cancelado_por === 'barbeiro' ? 'Barbeiro' : a.cancelado_por === 'cliente' ? 'Cliente' : a.cancelado_por}</strong>
                                    </p>
                                )}
                                
                                {/* OBSERVAÇÕES DO CLIENTE */}
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
                                            onClick={() => handleConcluirAgendamento(a)}
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
            )}
            
            {/* RENDERIZAÇÃO DO MODAL DE FECHAMENTO */}
            {agendamentoToClose && (
                <ModalFechamentoComanda 
                    agendamento={agendamentoToClose}
                    onClose={() => setAgendamentoToClose(null)}
                    onFinish={handleFechamentoSuccess} 
                />
            )}
            
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
};

export default ListaAgendamentos;