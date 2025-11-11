// src/pages/Transacoes.jsx (CÓDIGO FINAL COM VISUALIZAÇÃO CORRIGIDA E ESTILIZADA)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom'; 
import FormularioMovimentacao from '../components/ControleCaixa/FormularioMovimentacao';
import ListaMovimentacoes from '../components/ControleCaixa/ListaMovimentacoes';
import RelatorioMovimentacaoDetalhe from '../components/ControleCaixa/RelatorioMovimentacaoDetalhe';
import api from '../services/api'; 
import { useAuth } from '../contexts/AuthContext'; 

const Transacoes = () => {
    // VARIÁVEIS DE ESTADO
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [movimentacaoToEdit, setMovimentacaoToEdit] = useState(null); 
    const [saldoTotal, setSaldoTotal] = useState(0); 
    const [totalReceita, setTotalReceita] = useState(0);
    const [totalDespesa, setTotalDespesa] = useState(0);
    const [selectedMovimentacao, setSelectedMovimentacao] = useState(null); 
    
    // ESTADOS DE FILTRO
    const [searchTerm, setSearchTerm] = useState(''); 
    const [filterType, setFilterType] = useState('todos'); 
    const [filterPayment, setFilterPayment] = useState('todos'); 
    const [startDate, setStartDate] = useState(''); 
    const [endDate, setEndDate] = useState('');

    const location = useLocation(); 
    const { isAuthenticated } = useAuth(); 

    
    // FUNÇÃO PRINCIPAL: BUSCA DADOS E SALDO (OTIMIZADA E CORRIGIDA)
    const fetchMovimentacoes = useCallback(async () => {
        if (!isAuthenticated) return;
        
        setLoading(true);
        
        await new Promise(resolve => setTimeout(resolve, 50)); 

        try {
            const [listResponse, saldoResponse, totaisResponse] = await Promise.all([
                api.get('/movimentacoes'), // Lista do dia
                api.get('/saldo'), // Saldo do dia
                api.get('/totais/diarios') // Receitas e Despesas do Dia
            ]);
            
            // 1. Atualiza Totais
            setSaldoTotal(saldoResponse.data.saldo_total || 0); 
            setTotalReceita(totaisResponse.data.receita_total || 0);
            setTotalDespesa(totaisResponse.data.despesa_total || 0);
            
            // 2. Atualiza a Lista
            setMovimentacoes(listResponse.data);

        } catch (error) {
            console.error("Erro ao buscar dados ou saldo:", error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]); 


    // FUNÇÕES DE AÇÃO (CRUD)
    const handleEditStart = (movimentacao) => { setMovimentacaoToEdit(movimentacao); };
    const handleViewDetails = (movimentacao) => { setSelectedMovimentacao(movimentacao); };
    const handleCloseDetails = () => { setSelectedMovimentacao(null); };

    const handleDelete = async (id) => {
      if (window.confirm(`Tem certeza que deseja excluir a movimentação ID ${id}?`)) {
          try {
              await api.delete(`/movimentacoes/${id}`);
              alert('Movimentação excluída com sucesso!');
              fetchMovimentacoes(); 
          } catch (error) {
              console.error('Erro ao deletar movimentação:', error);
              alert('Erro ao deletar movimentação.');
          }
      }
    };

    // useEffect que chama o fetchMovimentacoes 
    useEffect(() => {
        fetchMovimentacoes();
    }, [fetchMovimentacoes, location.key]); 

    // LÓGICA DE FILTRO AVANÇADA
    const movimentacoesFiltradas = useMemo(() => {
        return movimentacoes.filter(mov => {
            const matchesSearch = mov.descricao.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'todos' || mov.tipo === filterType;
            const matchesPayment = filterPayment === 'todos' || mov.forma_pagamento === filterPayment;

            const movDate = mov.data_hora ? mov.data_hora.substring(0, 10) : ''; 
            let matchesDate = true;

            if (startDate) { matchesDate = matchesDate && (movDate >= startDate); }
            if (endDate) { matchesDate = matchesDate && (movDate <= endDate); }

            return matchesSearch && matchesType && matchesPayment && matchesDate;
        });
    }, [movimentacoes, searchTerm, filterType, filterPayment, startDate, endDate]);

    return (
        <div style={{ paddingBottom: '20px' }}> 
            {selectedMovimentacao && (
                <RelatorioMovimentacaoDetalhe 
                    movimentacao={selectedMovimentacao} 
                    onClose={handleCloseDetails} 
                />
            )}

            <div style={{ 
                display: 'flex', 
                gap: '30px', 
                padding: '30px', 
                backgroundColor: '#f5f5f5', // Fundo cinza claro
                minHeight: 'calc(100vh - 60px)'
            }}>
                
                {/* LADO ESQUERDO: FORMULÁRIO */}
                <div style={{ 
                    minWidth: '350px', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    backgroundColor: '#fff', 
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
                }}>
                    <h2 style={{ color: '#023047', borderBottom: '2px solid #FFB703', paddingBottom: '10px' }}>Nova Movimentação</h2>
                    <FormularioMovimentacao 
                        onMovimentacaoAdicionada={fetchMovimentacoes} 
                        movimentacaoData={movimentacaoToEdit} 
                        onCancelEdit={() => setMovimentacaoToEdit(null)} 
                    />
                </div>

                {/* LADO DIREITO: LISTA E RELATÓRIO */}
                <div style={{ flexGrow: 1 }}>
                    
                    {/* BLOCO DE RELATÓRIO RESUMO (RECEITAS, DESPESAS E SALDO/LUCRO) - ESTILIZADO */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-around', 
                        marginBottom: '30px', 
                        padding: '20px 0', 
                        borderRadius: '8px',
                        backgroundColor: '#fff', 
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                        
                        {/* COLUNA 1: RECEITAS BRUTAS */}
                        <div style={{ color: '#006400', textAlign: 'center', padding: '0 10px' }}>
                            <h3 style={{ margin: '0 0 5px 0' }}>Receitas Brutas</h3>
                            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2em' }}>R$ {parseFloat(totalReceita).toFixed(2)}</p>
                        </div>
                        
                        {/* COLUNA 2: SALDO / LUCRO LÍQUIDO DO DIA (DESTAQUE) */}
                        <div style={{ 
                            color: saldoTotal >= 0 ? '#023047' : '#cc0000', // Cores Chaves
                            textAlign: 'center',
                            padding: '0 25px', 
                            borderLeft: '1px solid #ddd', 
                            borderRight: '1px solid #ddd', 
                            fontWeight: 'bold'
                        }}>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4em', color: '#FFB703' }}>
                                Lucro Total
                            </h3>
                            <p style={{ margin: 0, fontWeight: 'bolder', fontSize: '1.8em' }}>
                                R$ {parseFloat(saldoTotal).toFixed(2)}
                            </p>
                        </div>

                        {/* COLUNA 3: DESPESAS TOTAIS */}
                        <div style={{ color: '#8b0000', textAlign: 'center', padding: '0 10px' }}>
                            <h3 style={{ margin: '0 0 5px 0' }}>Despesas Totais</h3>
                            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2em' }}>R$ {parseFloat(totalDespesa).toFixed(2)}</p>
                        </div>
                    </div>


                    {/* ÁREA DE FILTROS */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '10px', 
                        marginBottom: '20px', 
                        padding: '15px', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        flexWrap: 'wrap', 
                        alignItems: 'center' 
                    }}>
                        {/* Filtro de Busca */}
                        <input
                            type="text"
                            placeholder="Buscar por descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '8px', flexGrow: 1, minWidth: '150px' }}
                        />
                        
                        {/* Filtro de Data Início */}
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{ padding: '8px', minWidth: '120px' }}
                            title="Data de Início"
                        />

                        {/* Filtro de Data Fim */}
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{ padding: '8px', minWidth: '120px' }}
                            title="Data de Fim"
                        />
                        
                        {/* Filtro de Tipo */}
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '8px' }}>
                            <option value="todos">Tipo (Todos)</option>
                            <option value="receita">Receita</option>
                            <option value="despesa">Despesa</option>
                        </select>

                        {/* Filtro de Pagamento */}
                        <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} style={{ padding: '8px' }}>
                            <option value="todos">Pagamento (Todos)</option>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="cartao">Cartão</option>
                            <option value="pix">PIX</option>
                        </select>
                        
                        {/* BOTÃO DE ATUALIZAR DADOS (UX Fix) */}
                        <button 
                            type="button"
                            onClick={fetchMovimentacoes} 
                            style={{ 
                                padding: '8px 15px', 
                                cursor: 'pointer', 
                                border: '1px solid #023047', 
                                color: '#023047', 
                                backgroundColor: '#FFB703', 
                                fontWeight: 'bold' 
                            }}
                            title="Forçar atualização dos dados"
                        >
                            Atualizar Dados
                        </button>

                    </div>
                    {/* FIM DA ÁREA DE FILTROS */}

                    <ListaMovimentacoes 
                        movimentacoes={movimentacoesFiltradas} 
                        loading={loading} 
                        onDelete={handleDelete} 
                        onEditStart={handleEditStart}
                        onViewDetails={handleViewDetails}
                    />
                </div>
            </div>
        </div>
    );
};

export default Transacoes;