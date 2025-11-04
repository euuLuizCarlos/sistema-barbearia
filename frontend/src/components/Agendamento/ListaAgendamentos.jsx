// src/components/Agendamento/ListaAgendamentos.jsx (CÓDIGO DE LISTAGEM)
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 

const ListaAgendamentos = ({ onDelete, onEditStart, onAgendamentoAdicionado, key }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Efeito que busca os dados da API ao carregar
  useEffect(() => {
    async function fetchAgendamentos() {
      try {
        const response = await api.get('/agendamentos');
        setAgendamentos(response.data);
      } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAgendamentos();
  }, [key]); // Adiciona 'key' para forçar recarga


  if (loading) {
    return <h2>Carregando Agendamentos...</h2>;
  }

  return (
    <div style={{ padding: '0px' }}>
      <h2>Total de Agendamentos: {agendamentos.length}</h2>
      
      {agendamentos.length === 0 ? (
          <p>Nenhum agendamento encontrado.</p>
      ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
              {agendamentos.map(a => (
                  <li key={a.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                      <p style={{ margin: '0 0 5px 0' }}>
                          Cliente ID: {a.cliente_id} | 
                          Barbeiro ID: {a.barbeiro_id} |
                          Serviço: **{a.servico}**
                      </p>
                      <p style={{ margin: 0, fontSize: '0.9em', color: '#555' }}>
                          Data: {new Date(a.data_hora).toLocaleDateString('pt-BR')} às {new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {/* Botões de Ação (Ainda não implementados neste componente) */}
                  </li>
              ))}
          </ul>
      )}
    </div>
  );
};

export default ListaAgendamentos;