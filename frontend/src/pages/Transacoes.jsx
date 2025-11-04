// src/pages/Transacoes.jsx - CÓDIGO FINAL E CORRIGIDO PARA MULTI-TENANCY E ROTA
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
    
    // ESTADOS DE FILTRO (MANTIDOS)
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
            // REQUISIÇÕES CORRIGIDAS: URLs sem o ID
            const [listResponse, saldoResponse, totaisResponse] = await Promise.all([
                api.get('/movimentacoes'), // 1. Lista do dia
                api.get('/saldo'), // 2. Saldo do dia (CORRIGIDO: SEM ID)
                api.get('/totais/diarios') // 3. Receitas e Despesas do Dia (CORRIGIDO: SEM ID)
            ]);
            
            // 1. Atualiza Totais
            setSaldoTotal(saldoResponse.data.saldo_total || 0); 
            setTotalReceita(totaisResponse.data.receita_total || 0);
            setTotalDespesa(totaisResponse.data.despesa_total || 0);
            
            // 2. Atualiza a Lista
            setMovimentacoes(listResponse.data);

        } catch (error) {
            console.error("Erro ao buscar dados ou saldo:", error);
            // Se o erro for 401, o PrivateRoute já vai cuidar do redirecionamento
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]); 


    // FUNÇÕES DE AÇÃO (MANTIDAS)
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

    // LÓGICA DE FILTRO AVANÇADA (MANTIDA)
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

            <div style={{ display: 'flex', gap: '30px', padding: '20px' }}>
                
                {/* LADO ESQUERDO: FORMULÁRIO */}
                <div style={{ minWidth: '350px' }}>
                    <FormularioMovimentacao 
                        onMovimentacaoAdicionada={fetchMovimentacoes} 
                        movimentacaoData={movimentacaoToEdit} 
                        onCancelEdit={() => setMovimentacaoToEdit(null)} 
                    />
                </div>

                {/* LADO DIREITO: LISTA E RELATÓRIO */}
                <div style={{ flexGrow: 1 }}>
                    
                    {/* RELATÓRIO RESUMO (RECEITAS E DESPESAS TOTAIS) */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-around', 
                        marginBottom: '20px', 
                        padding: '10px 0', 
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                    }}>
                        <div style={{ color: 'green', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 5px 0' }}>Receitas Totais</h3>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>R$ {parseFloat(totalReceita).toFixed(2)}</p>
                        </div>
                        <div style={{ color: 'red', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 5px 0' }}>Despesas Totais</h3>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>R$ {parseFloat(totalDespesa).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* ÁREA DE FILTROS */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        
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
                            style={{ padding: '8px 15px', cursor: 'pointer', border: '1px solid #aaa' }}
                            title="Forçar atualização dos dados"
                        >
                            Atualizar Dados
                        </button>

                    </div>
                    {/* FIM DA ÁREA DE FILTROS */}


                    <h2 style={{ 
                        color: saldoTotal >= 0 ? 'green' : 'red', 
                        borderBottom: '2px solid', 
                        paddingBottom: '10px' 
                    }}>
                        SALDO TOTAL: R$ {parseFloat(saldoTotal).toFixed(2)}
                    </h2>
                    
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