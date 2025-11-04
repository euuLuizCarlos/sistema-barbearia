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
      
      <ul>
        {movimentacoes.map(mov => (
          <li key={mov.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            
            {/* NOVO: Área Clicável para abrir o modal */}
            <span 
                onClick={() => onViewDetails(mov)} // Chama a função e passa o objeto 'mov' inteiro
                style={{ flexGrow: 1, cursor: 'pointer', textDecoration: 'underline' }}
            >
                R$ {parseFloat(mov.valor).toFixed(2)} | {mov.descricao} 
                <span style={{ fontSize: '0.8em', color: '#aaa', marginLeft: '10px' }}>
                    ({new Date(mov.data_hora).toLocaleDateString('pt-BR')})
                </span>
            </span>

            {/* Botões de Ação */}
            <button 
                onClick={() => onEditStart(mov)} 
                style={{ marginLeft: '15px', color: 'blue', cursor: 'pointer', background: 'none', border: 'none' }}
            >
                Editar
            </button>
            <button 
                onClick={() => onDelete(mov.id)} 
                style={{ marginLeft: '15px', color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}
            >
                Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaMovimentacoes;