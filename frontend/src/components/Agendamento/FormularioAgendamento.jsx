// src/components/Agendamento/FormularioAgendamento.jsx (CÓDIGO FINAL DE CRIAÇÃO)
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const FormularioAgendamento = ({ onAgendamentoAdicionado }) => {
  
  // Estados para listas de seleção
  const [clientes, setClientes] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para os dados do agendamento
  const [formData, setFormData] = useState({
    cliente_id: '',
    barbeiro_id: '',
    data_hora: '',
    servico: '',
  });

  // Efeito para buscar a lista de clientes e barbeiros
  useEffect(() => {
    async function fetchListas() {
      try {
        const [clientesResponse, barbeirosResponse] = await Promise.all([
            api.get('/clientes'), 
            api.get('/barbeiros')
        ]);
        
        setClientes(clientesResponse.data);
        setBarbeiros(barbeirosResponse.data);
        
      } catch (error) {
        console.error("Erro ao buscar listas de seleção:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchListas();
  }, []);

  // Lida com a mudança nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Lida com o envio do agendamento (POST)
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    // Converte a data do formato local para o formato do banco de dados (YYYY-MM-DD HH:MM:SS)
    const dataHoraFormatada = formData.data_hora.replace('T', ' ') + ':00';

    const dadosParaEnviar = {
        ...formData,
        cliente_id: parseInt(formData.cliente_id), 
        barbeiro_id: parseInt(formData.barbeiro_id), 
        data_hora: dataHoraFormatada,
    };

    try {
      await api.post('/agendamentos', dadosParaEnviar);
      alert('Agendamento criado com sucesso!');
      
      // Limpa o formulário e atualiza a lista
      setFormData({ cliente_id: '', barbeiro_id: '', data_hora: '', servico: '' });
      if (onAgendamentoAdicionado) {
          onAgendamentoAdicionado();
      }

    } catch (error) {
      console.error('Erro ao criar agendamento:', error.response ? error.response.data : error.message);
      alert('Erro ao criar agendamento. Verifique o console.');
    }
  };

  if (loading) {
    return <div>Carregando opções de agendamento...</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px' }}>
      <h2>Novo Agendamento</h2>
      <form onSubmit={handleSubmit}>
        
        <label>Cliente:</label>
        <select name="cliente_id" value={formData.cliente_id} onChange={handleChange} required>
          <option value="">Selecione o Cliente</option>
          {clientes.map(cliente => (
              <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
          ))}
        </select>
        <br/><br/>

        <label>Barbeiro:</label>
        <select name="barbeiro_id" value={formData.barbeiro_id} onChange={handleChange} required>
          <option value="">Selecione o Barbeiro</option>
          {barbeiros.map(barbeiro => (
              <option key={barbeiro.id} value={barbeiro.id}>{barbeiro.nome}</option>
          ))}
        </select>
        <br/><br/>

        <label>Data e Hora:</label>
        <input 
          type="datetime-local" 
          name="data_hora" 
          value={formData.data_hora} 
          onChange={handleChange} 
          required 
        />
        <br/><br/>

        <label>Serviço:</label>
        <input 
          type="text" 
          name="servico" 
          value={formData.servico} 
          onChange={handleChange} 
          required 
        />
        <br/><br/>

        <button type="submit">Agendar</button>
      </form>
    </div>
  );
};

export default FormularioAgendamento;