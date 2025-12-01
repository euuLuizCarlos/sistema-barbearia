// src/components/Agendamento/ListaAgendamentos.jsx (VERSÃO FINAL E CORRIGIDA)

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api'; 
// 🚨 CORREÇÃO: FaUserCircle ADICIONADO AQUI 🚨
import { FaUser, FaClock, FaCut, FaDollarSign, FaCheck, FaTimes, FaSpinner, FaSearch, FaStar, FaUserTie, FaUserCircle } from 'react-icons/fa';
import ModalFechamentoComanda from './ModalFechamentoComanda';
import { useUi } from '../../contexts/UiContext'; 
import { useAuth } from '../../contexts/AuthContext'; 
// import ModalAvaliacaoBarbeiro from '../Auth/ModalAvaliacaoBarbeiro.jsx'; // 🚨 REMOVIDO: ESTE MODAL PERTENCE À VISÃO DO CLIENTE 🚨

// =======================================================
// DEFINIÇÕES DE CORES LOCAIS (Para consistência e estabilidade)
// =======================================================
const COLORS = {
    PRIMARY: '#023047',
    ACCENT: '#FFB703',
    SUCCESS: '#4CAF50',
    ERROR: '#cc0000',
    SECONDARY_TEXT: '#888888',
    BACKGROUND_LIGHT: '#f8f8f8', // 🚨 ADICIONADO: Nova cor para usar no fundo 🚨
};


const ListaAgendamentos = ({ refreshKey }) => {
    const { user } = useAuth();
    const ui = useUi(); // 🚨 CORREÇÃO: useUi deve ser chamado aqui, dentro do componente 🚨
    const barbeiroId = user?.userId;

    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [dataPesquisa, setDataPesquisa] = useState(''); 
    const [agendamentoToClose, setAgendamentoToClose] = useState(null); 

    // O estado 'agendamentoToReview' e a lógica relacionada ao ModalAvaliacaoBarbeiro
    // foram removidos deste componente, pois eles pertencem à interface do cliente.
    // const [agendamentoToReview, setAgendamentoToReview] = useState(null);

    // Funções de Estilo (para o Status)
    const getStatusStyle = (status) => {
        switch (status) {
            case 'concluido': return { color: 'white', backgroundColor: COLORS.SUCCESS, label: 'CONCLUÍDO' };
            case 'cancelado': return { color: 'white', backgroundColor: COLORS.ERROR, label: 'CANCELADO' };
            case 'agendado': 
            default: return { color: 'black', backgroundColor: COLORS.ACCENT, label: 'AGENDADO' };
        }
    };
    
    // FUNÇÃO DE REPUTAÇÃO DO CLIENTE (Chave para a exibição)
    const renderReputacaoCliente = (media) => {
        if (media === null || media === undefined || media === '0.0') {
            return <span style={{ color: COLORS.SECONDARY_TEXT, fontSize: '0.9em' }}>Sem avaliações anteriores</span>;
        }
        
        const rating = parseFloat(media);
        
        return (
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '1em', fontWeight: 'bold', color: COLORS.PRIMARY }}>
                <FaStar size={14} style={{ color: COLORS.ACCENT, marginRight: '5px' }} />
                {rating.toFixed(1)} / 5.0
            </div>
        );
    };


    // Função para buscar os agendamentos (Integrando a busca por data)
    const fetchAgendamentos = useCallback(async () => {
        if (!barbeiroId) {
             setError("ID do Barbeiro não encontrado. Faça login novamente.");
             setLoading(false);
             return;
        }

        setLoading(true);
        setError(null);
        try {
            // Se dataPesquisa estiver vazia, buscará a data atual no backend.
            // Se tiver um valor, buscará para a data específica.
            const url = dataPesquisa 
                ? `/agendamentos/data?data=${dataPesquisa}` 
                : `/agendamentos/data`; // O backend deve ter a lógica para data atual se 'data' não for fornecida.
            
            const response = await api.get(url); 
            
            // 🚨 NOTA: O backend DEVE retornar a coluna 'foto_cliente_url' (como no server.js que forneci)
            setAgendamentos(response.data);
            
        } catch (error) {
            console.error("Erro ao buscar agendamentos:", error);
            setError(error.response?.data?.error || 'Erro ao carregar a agenda. Verifique o backend e sua rota /agendamentos/data.');
        } finally {
            setLoading(false);
        }
    }, [dataPesquisa, refreshKey, barbeiroId]); 

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos, refreshKey]); 

    
    // ---------------------------------------------
    // FUNÇÕES DE AÇÃO
    // ---------------------------------------------

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

    // FUNÇÃO PARA ABRIR O MODAL DE FECHAMENTO (CHAMADO PELO BOTÃO CONCLUIR)
    const handleConcluirAgendamento = (agendamento) => {
        setAgendamentoToClose(agendamento);
    };

    // Função chamada ao fechar o modal de comanda
    const handleFechamentoSuccess = (message) => {
        setAgendamentoToClose(null); // Fecha o modal de comanda
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
        return <h2 style={{ color: COLORS.ERROR, padding: '20px' }}>Erro: {error}</h2>;
    }

    const valorTotalAgendamentos = agendamentos.reduce((acc, a) => acc + parseFloat(a.valor_servico || 0), 0);

    return (
        <div style={{ padding: '0px' }}>
            
            {/* CAMPO DE PESQUISA POR DATA (Mantido) */}
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: COLORS.BACKGROUND_LIGHT }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: COLORS.PRIMARY }}>
                    <FaSearch style={{ marginRight: '5px'}}/> Pesquisar por Data Específica:
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
                        style={{ padding: '10px 15px', backgroundColor: COLORS.SECONDARY_TEXT, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Limpar Filtro
                    </button>
                </div>
                {dataPesquisa && (
                    <p style={{ marginTop: '10px', color: COLORS.PRIMARY, fontWeight: 'bold' }}>
                        * Exibindo agendamentos para {new Date(dataPesquisa).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}.
                    </p>
                )}
            </div>
            
            <h2 style={{ color: '#555', marginBottom: '10px' }}>
                {dataPesquisa ? 'Agendamentos Encontrados' : 'Próximos Agendamentos'}
            </h2>
            <p style={{ marginBottom: '20px', fontWeight: 'bold' }}>
                Total de Agendamentos: {agendamentos.length} | 
                Valor Total (Base): R$ {valorTotalAgendamentos.toFixed(2)}
            </p>

            {agendamentos.length === 0 ? (
                <p style={{ marginTop: '20px', fontSize: '1.2em' }}>Nenhum agendamento encontrado para o filtro atual.</p>
            ) : (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
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
                        
                        // 🚨 LÓGICA DA FOTO DO CLIENTE 🚨
                        const showPhoto = a.foto_cliente_url; // URL completa vinda do backend
                        // A propriedade nome_cliente nunca deve ser null, mas garantimos um fallback
                        const photoPlaceholderInitials = a.nome_cliente ? a.nome_cliente.substring(0, 2).toUpperCase() : 'CL';

                        return (
                            <li key={a.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: isPending ? '#f0fff4' : '#fff' }}>
                                
                                {/* LINHA 1: HORÁRIO E STATUS */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                    <h3 style={{ margin: 0, color: COLORS.PRIMARY, display: 'flex', alignItems: 'center' }}>
                                        <FaClock style={{ marginRight: '8px' }} />
                                        {dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} | {dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {dataFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </h3>
                                    <span style={{ ...statusInfo, padding: '5px 10px', fontWeight: 'bold', borderRadius: '4px' }}>
                                        {statusInfo.label}
                                    </span>
                                </div>

                                {/* 🚨 LINHA 2: FOTO, NOME DO CLIENTE E REPUTAÇÃO 🚨 */}
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                    
                                    {/* 💡 CÍRCULO DA FOTO/INICIAIS */}
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: COLORS.SECONDARY_TEXT, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: '15px', border: '2px solid #ccc' }}>
                                        {showPhoto ? (
                                            <img src={showPhoto} alt={a.nome_cliente} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <FaUserCircle size={35} color="white" />
                                            // Ou para iniciais: <span style={{color: 'white', fontSize: '1.2em'}}>{photoPlaceholderInitials}</span>
                                        )}
                                    </div>

                                    {/* NOME DO CLIENTE E REPUTAÇÃO */}
                                    <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1em', color: COLORS.PRIMARY }}>
                                            Cliente: **{a.nome_cliente}**
                                        </p>
                                        {renderReputacaoCliente(a.media_avaliacao_cliente)}
                                    </div>
                                </div>

                                {/* DADOS DO SERVIÇO E VALOR */}
                                <p style={{ margin: '5px 0' }}><FaCut style={{ marginRight: '5px'}}/> Serviço: **{a.nome_servico}**</p>
                                <p style={{ margin: '5px 0' }}><FaDollarSign style={{ marginRight: '5px', color: COLORS.SUCCESS }}/> Valor Base: **R$ {valorFormatado}**</p>
                                
                                
                                {/* EXIBIÇÃO DO MOTIVO DE CANCELAMENTO */}
                                {a.status === 'cancelado' && a.motivo_cancelamento && (
                                    <p style={{ 
                                        margin: '10px 0 0 0', color: COLORS.ERROR, fontStyle: 'italic', 
                                        borderLeft: `3px solid ${COLORS.ERROR}`, paddingLeft: '10px' 
                                    }}>
                                        Motivo: {a.motivo_cancelamento} (Cancelado por: **{a.cancelado_por}**)
                                    </p>
                                )}
                                
                                {/* OBSERVAÇÕES DO CLIENTE */}
                                {(a.observacao || a.preferencia) && (
                                    <div style={{ borderTop: '1px dashed #eee', paddingTop: '10px', marginTop: '15px', fontSize: '0.9em', color: '#777' }}>
                                        {a.observacao && <p style={{ margin: '0' }}>**Obs:** {a.observacao}</p>}
                                        {a.preferencia && <p style={{ margin: '0' }}>**Preferencia:** {a.preferencia}</p>}
                                    </div>
                                )}

                                {/* BOTÕES DE AÇÃO (Apenas se 'agendado') */}
                                {isPending && (
                                    <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                                        <button 
                                            onClick={() => handleConcluirAgendamento(a)}
                                            style={{ padding: '10px 20px', backgroundColor: COLORS.SUCCESS, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}
                                        >
                                            <FaCheck style={{ marginRight: '5px' }} />
                                            Concluir (Avaliar & Fechar)
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
            
            {/* RENDERIZAÇÃO DO MODAL DE FECHAMENTO (Barbeiro avalia Cliente) */}
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