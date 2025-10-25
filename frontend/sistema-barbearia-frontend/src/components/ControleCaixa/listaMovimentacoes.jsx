// src/components/ControleCaixa/ListaMovimentacoes.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Importa a instância do axios

const ListaMovimentacoes = () => {
  // Estado para armazenar a lista de movimentações
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect para rodar a requisição apenas uma vez, ao carregar o componente
  useEffect(() => {
    async function fetchMovimentacoes() {
      try {
        // Chama a rota GET /movimentacoes da sua API
        const response = await api.get('/movimentacoes');
        
        // Armazena os dados no estado
        setMovimentacoes(response.data);
        console.log("Dados carregados com sucesso:", response.data); 
        
      } catch (error) {
        console.error("Erro ao buscar movimentações:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovimentacoes();
  }, []); // O array vazio garante que a função só roda no carregamento

  if (loading) {
    return <h2>Carregando dados...</h2>;
  }

  return (
    <div>
      <h1>Controle de Caixa</h1>
      <h2>Total de Movimentações: {movimentacoes.length}</h2>
      
      {/* Estrutura simples para listar os dados */}
      <ul>
        {movimentacoes.map(mov => (
          <li key={mov.id}>
            R$ {mov.valor} - {mov.descricao} ({mov.tipo} - {mov.forma_pagamento})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaMovimentacoes;