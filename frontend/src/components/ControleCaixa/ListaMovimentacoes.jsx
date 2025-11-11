// src/components/ControleCaixa/ListaMovimentacoes.jsx (CÓDIGO COMPLETO E ATUALIZADO)
import React from 'react';

// Agora recebe onViewDetails
const ListaMovimentacoes = ({ movimentacoes, loading, onDelete, onEditStart, onViewDetails }) => { 
  
  if (loading) {
    return <h2>Carregando dados...</h2>;
  }

  if (movimentacoes.length === 0) {
    return <h2>Nenhuma movimentação encontrada.</h2>;
  }

  return (
        <div>
            <h1>Lista de Movimentações</h1>
            <h2>Total de Registros: {movimentacoes.length}</h2>
            
            {/* 🚨 CORREÇÃO: Aplicando estilos de card no <ul> e <li> */}
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {movimentacoes.map(mov => (
                    <li 
                        key={mov.id} 
                        // 🚨 NOVO ESTILO DE CARD: Com sombra, fundo e cor lateral
                        style={{ 
                            marginBottom: '15px', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            backgroundColor: '#ffffff', // Fundo branco
                            // Cor da borda lateral baseada no tipo (Receita: Verde | Despesa: Vermelho)
                            borderLeft: `5px solid ${mov.tipo === 'receita' ? '#4CAF50' : '#FF5722'}`, 
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Sombra para separação
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'box-shadow 0.3s ease'
                        }}
                        // Efeito visual (Hover)
                        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'}
                    >
                        
                        {/* Conteúdo Principal (Descrição e Valor) */}
                        <span 
                            onClick={() => onViewDetails(mov)} 
                            style={{ flexGrow: 1, cursor: 'pointer', paddingRight: '15px' }} // Removida a decoração underline
                        >
                            <p style={{ margin: '0 0 5px 0' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1.2em', color: mov.tipo === 'receita' ? '#4CAF50' : '#FF5722' }}>
                                    R$ {parseFloat(mov.valor).toFixed(2)} 
                                </span>
                                <span style={{ fontSize: '0.8em', color: '#888', marginLeft: '10px' }}>
                                    {mov.forma_pagamento.toUpperCase()}
                                </span>
                            </p>
                            <p style={{ margin: 0, fontSize: '0.9em', color: '#333', fontWeight: '500' }}>
                                {mov.descricao} 
                                <span style={{ fontSize: '0.8em', color: '#aaa', marginLeft: '10px' }}>
                                    ({new Date(mov.data_hora).toLocaleDateString('pt-BR')})
                                </span>
                            </p>
                        </span>

                        {/* Botões de Ação */}
                        <div style={{ marginLeft: '15px', whiteSpace: 'nowrap' }}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEditStart(mov); }} 
                                style={{ marginLeft: '15px', color: 'blue', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 'bold' }}
                            >
                                Editar
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(mov.id); }} 
                                style={{ marginLeft: '10px', color: 'red', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 'bold' }}
                            >
                                Excluir
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ListaMovimentacoes;