// src/components/Agendamento/ListaAgendamentosTodos.jsx
// NOVO COMPONENTE: Mostra TODOS os agendamentos (presentes e futuros) com opção de filtro por data

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api'; 
import { FaUser, FaClock, FaCut, FaDollarSign, FaCheck, FaTimes, FaSpinner, FaSearch, FaStar, FaUserCircle, FaEye } from 'react-icons/fa';
import ModalFechamentoComanda from './ModalFechamentoComanda';
import { useUi } from '../../contexts/UiContext'; 
import { useAuth } from '../../contexts/AuthContext';
import { MESES_PT_ABREV } from '../../helpers/dateFormatting'; 

const COLORS = {
    PRIMARY: '#023047',
    ACCENT: '#FFB703',
    SUCCESS: '#4CAF50',
    ERROR: '#cc0000',
    SECONDARY_TEXT: '#888888',
    BACKGROUND_LIGHT: '#f8f8f8',
};

const ListaAgendamentosTodos = ({ refreshKey }) => {
    const { user } = useAuth();
    const ui = useUi();
    const barbeiroId = user?.userId;

    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [agendamentoToClose, setAgendamentoToClose] = useState(null);
    const [filtroData, setFiltroData] = useState(''); // Filtro opcional de data

    // Função para buscar TODOS os agendamentos
    const fetchTodosAgendamentos = useCallback(async () => {
        if (!barbeiroId) {
            setError("ID do Barbeiro não encontrado. Faça login novamente.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/agendamentos/todos');
            console.log('Agendamentos retornados do backend:', response.data);
            setAgendamentos(response.data);
        } catch (error) {
            console.error("Erro ao buscar agendamentos:", error);
            setError(error.response?.data?.error || 'Erro ao carregar a agenda.');
        } finally {
            setLoading(false);
        }
    }, [barbeiroId]);

    // Efeito para carregamento inicial
    useEffect(() => {
        fetchTodosAgendamentos();
    }, [refreshKey, fetchTodosAgendamentos]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'concluido': return { color: 'white', backgroundColor: COLORS.SUCCESS, label: 'CONCLUÍDO' };
            case 'cancelado': return { color: 'white', backgroundColor: COLORS.ERROR, label: 'CANCELADO' };
            case 'agendado': 
            default: return { color: 'black', backgroundColor: COLORS.ACCENT, label: 'AGENDADO' };
        }
    };
    
    const renderReputacaoCliente = (media) => {
        if (media === null || media === undefined || media === '0.0') {
            return <span style={{ color: COLORS.SECONDARY_TEXT, fontSize: '0.9em' }}>Sem avaliações</span>;
        }
        
        const rating = parseFloat(media);
        return (
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '1em', fontWeight: 'bold', color: COLORS.PRIMARY }}>
                <FaStar size={14} style={{ color: COLORS.ACCENT, marginRight: '5px' }} />
                {rating.toFixed(1)} / 5.0
            </div>
        );
    };

    const handleConcluirAgendamento = (agendamento) => {
        setAgendamentoToClose(agendamento);
    };

    const handleFechamentoSuccess = (message) => {
        setAgendamentoToClose(null);
        ui.showPostIt(message, 'success');
        fetchTodosAgendamentos();
    };

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
            fetchTodosAgendamentos();
        } catch (error) {
            console.error(`Erro ao cancelar agendamento:`, error);
            ui.showPostIt(error.response?.data?.error || 'Falha ao cancelar. Tente novamente.', 'error');
        }
    };

    const handleClearFilter = () => {
        setFiltroData('');
    };

    // Função para extrair a data local de um datetime string (YYYY-MM-DD HH:MM:SS)
    // Sem conversão de timezone
    const extrairDataLocal = (dataHoraString) => {
        if (!dataHoraString) return null;
        const resultado = dataHoraString.split(' ')[0]; // Retorna apenas YYYY-MM-DD
        return resultado;
    };

    // Filtra agendamentos por data se filtroData estiver definida
    const agendamentosExibidos = filtroData 
        ? agendamentos.filter(a => {
            try {
                const dataLocal = extrairDataLocal(a.data_hora_inicio);
                const matches = dataLocal === filtroData;
                console.log(`Comparando: "${dataLocal}" === "${filtroData}" = ${matches}`, a);
                return matches;
            } catch (e) {
                console.error('Erro ao filtrar data:', e, a);
                return true;
            }
        })
        : agendamentos;

    if (loading) {
        return <h2 style={{ textAlign: 'center', padding: '50px' }}><FaSpinner className="spinner" /> Carregando Agenda...</h2>;
    }
    
    if (error) {
        return <h2 style={{ color: COLORS.ERROR, padding: '20px' }}>Erro: {error}</h2>;
    }

    return (
        <div style={{ padding: '0px' }}>
            
            {/* FILTRO OPCIONAL DE DATA */}
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: COLORS.BACKGROUND_LIGHT }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: COLORS.PRIMARY }}>
                    <FaSearch style={{ marginRight: '5px'}}/> Filtrar por Data (Opcional):
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={filtroData}
                        onChange={(e) => {
                            console.log('Filtro data mudou para:', e.target.value);
                            setFiltroData(e.target.value);
                        }}
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', flexGrow: 1 }}
                    />
                    <button
                        onClick={handleClearFilter}
                        disabled={!filtroData}
                        style={{ padding: '10px 15px', backgroundColor: COLORS.SECONDARY_TEXT, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Limpar
                    </button>
                </div>
                {filtroData && (
                    <p style={{ marginTop: '10px', color: COLORS.PRIMARY, fontWeight: 'bold' }}>
                        * Exibindo agendamentos para {filtroData.split('-').reverse().join('/')}.
                    </p>
                )}
            </div>
            
            <h2 style={{ color: '#555', marginBottom: '10px' }}>
                Todos os Agendamentos
            </h2>
            <p style={{ marginBottom: '20px', fontWeight: 'bold' }}>
                Total: {agendamentosExibidos.length} agendamento(ns) | 
                Valor Total: R$ {agendamentosExibidos.reduce((acc, a) => acc + parseFloat(a.valor_servico || 0), 0).toFixed(2)}
            </p>

            {agendamentosExibidos.length === 0 ? (
                <p style={{ marginTop: '20px', fontSize: '1.2em' }}>Nenhum agendamento encontrado.</p>
            ) : (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {([...agendamentosExibidos].sort((x, y) => {
                        const px = x.status === 'agendado' ? 0 : 1;
                        const py = y.status === 'agendado' ? 0 : 1;
                        if (px !== py) return px - py;
                        // Compara strings YYYY-MM-DD HH:MM:SS diretamente (ordem lexicográfica funciona)
                        return x.data_hora_inicio.localeCompare(y.data_hora_inicio);
                    })).map(a => {
                        const statusInfo = getStatusStyle(a.status);
                        
                        // Extrai data e hora sem conversão de timezone
                        const [dataParte, horaParte] = a.data_hora_inicio.split(' ');
                        const [dataFimParte, horaFimParte] = a.data_hora_fim.split(' ');
                        
                        // Converte YYYY-MM-DD em DD/MMM/YY para exibição
                        const [year, month, day] = dataParte.split('-');
                        const dataFormatada = `${day}/${MESES_PT_ABREV[parseInt(month) - 1]}/${year.slice(2)}`;
                        
                        const valorFormatado = parseFloat(a.valor_servico || 0).toFixed(2);
                        const isPending = a.status === 'agendado';
                        
                        const showPhoto = a.foto_cliente_url;

                        return (
                            <li key={a.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: isPending ? '#f0fff4' : '#fff' }}>
                                
                                {/* LINHA 1: HORÁRIO E STATUS */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                    <h3 style={{ margin: 0, color: COLORS.PRIMARY, display: 'flex', alignItems: 'center' }}>
                                        <FaClock style={{ marginRight: '8px' }} />
                                        {dataFormatada} | {horaParte} - {horaFimParte}
                                    </h3>
                                    <span style={{ ...statusInfo, padding: '5px 10px', fontWeight: 'bold', borderRadius: '4px' }}>
                                        {statusInfo.label}
                                    </span>
                                </div>

                                {/* LINHA 2: FOTO, NOME DO CLIENTE E REPUTAÇÃO */}
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: COLORS.SECONDARY_TEXT, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: '15px', border: '2px solid #ccc' }}>
                                        {showPhoto ? (
                                            <img src={showPhoto} alt={a.nome_cliente} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <FaUserCircle size={35} color="white" />
                                        )}
                                    </div>

                                    <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1em', color: COLORS.PRIMARY }}>
                                            {a.nome_cliente}
                                        </p>
                                        {renderReputacaoCliente(a.media_avaliacao_cliente)}
                                    </div>
                                </div>

                                {/* DADOS DO SERVIÇO E VALOR */}
                                <p style={{ margin: '5px 0' }}><FaCut style={{ marginRight: '5px'}}/> {a.nome_servico}</p>
                                <p style={{ margin: '5px 0' }}><FaDollarSign style={{ marginRight: '5px', color: COLORS.SUCCESS }}/> R$ {valorFormatado}</p>
                                
                                {/* MOTIVO DE CANCELAMENTO */}
                                {a.status === 'cancelado' && a.motivo_cancelamento && (
                                    <p style={{ 
                                        margin: '10px 0 0 0', color: COLORS.ERROR, fontStyle: 'italic', 
                                        borderLeft: `3px solid ${COLORS.ERROR}`, paddingLeft: '10px' 
                                    }}>
                                        Motivo: {a.motivo_cancelamento} (Cancelado por: {a.cancelado_por})
                                    </p>
                                )}
                                
                                {/* OBSERVAÇÕES */}
                                {(a.observacao || a.preferencia) && (
                                    <div style={{ borderTop: '1px dashed #eee', paddingTop: '10px', marginTop: '15px', fontSize: '0.9em', color: '#777' }}>
                                        {a.observacao && <p style={{ margin: '0' }}>Obs: {a.observacao}</p>}
                                        {a.preferencia && <p style={{ margin: '0' }}>Preferência: {a.preferencia}</p>}
                                    </div>
                                )}

                                {/* BOTÕES DE AÇÃO */}
                                {isPending && (
                                    <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                                        <button 
                                            onClick={() => handleConcluirAgendamento(a)}
                                            style={{ padding: '10px 20px', backgroundColor: COLORS.SUCCESS, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}
                                        >
                                            <FaCheck style={{ marginRight: '5px' }} />
                                            Concluir
                                        </button>
                                        <button 
                                            onClick={() => handleCancelarAgendamento(a.id)}
                                            style={{ padding: '10px 20px', backgroundColor: COLORS.ERROR, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
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
            
            {/* MODAL DE FECHAMENTO */}
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

export default ListaAgendamentosTodos;
