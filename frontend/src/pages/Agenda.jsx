// src/pages/Agenda.jsx (CÓDIGO FINAL DE INTEGRAÇÃO)
import React, { useState } from 'react';
import FormularioAgendamento from '../components/Agendamento/FormularioAgendamento';
import ListaAgendamentos from '../components/Agendamento/ListaAgendamentos';

const Agenda = () => {
  const [refreshKey, setRefreshKey] = useState(0); 
  
  // Função que será passada para o formulário para forçar a atualização da lista
  const handleAgendamentoAdicionado = () => {
    setRefreshKey(prevKey => prevKey + 1); // Força a ListaAgendamentos a recarregar
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* 1. Formulário de Criação (POST) */}
      <div style={{ minWidth: '400px' }}>
        <FormularioAgendamento onAgendamentoAdicionado={handleAgendamentoAdicionado} />
      </div>

      {/* 2. Lista de Agendamentos (GET) - Usa a chave para forçar a recarga */}
      <div style={{ flexGrow: 1 }}>
        <h1>Próximos Agendamentos</h1>
        {/* Passamos a key para forçar a recarga no useEffect do ListaAgendamentos */}
        <ListaAgendamentos key={refreshKey} /> 
      </div>
    </div>
  );
};

export default Agenda;