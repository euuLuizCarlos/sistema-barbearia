// src/components/ControleCaixa/ListaMovimentacoes.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 

const ListaMovimentacoes = () => {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Efeito que busca os dados da API ao carregar
  useEffect(() => {
    async function fetchMovimentacoes() {
      try {
        // Faz a chamada GET para sua rota Node.js
        const response = await api.get('/movimentacoes');
        
        // Armazena e exibe os dados (que vieram do MySQL)
        setMovimentacoes(response.data);
      } catch (error) {
        console.error("Erro ao buscar movimentações:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMovimentacoes();
  }, []); // Array vazio = roda apenas uma vez

  if (loading) {
    return <h2>Carregando dados...</h2>;
  }

  // Se o carregamento terminou, mostra a lista
  return (
    <div>
      <h1>Controle de Caixa</h1>
      <h2>Total de Movimentações: {movimentacoes.length}</h2>
      
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