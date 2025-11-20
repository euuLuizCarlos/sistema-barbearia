// src/components/ControleCaixa/FormularioMovimentacao.jsx (CÓDIGO FINAL MULTI-TENANT)
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext'; 
import { useUi } from '../../contexts/UiContext';

const FormularioMovimentacao = ({ 
    onMovimentacaoAdicionada, 
    movimentacaoData, 
    onCancelEdit 
}) => {
  
  const { user } = useAuth();
  const ui = useUi();
  const loggedInBarbeiroId = user ? user.userId : 0;

  // 🚨 CORREÇÃO 1: Definir o estado inicial como uma função acessível
  const getInitialState = (barbeiroId) => ({
    barbeiro_id: barbeiroId,
    descricao: '',
    valor: '',
    tipo: 'receita',
    categoria: 'servico',
    forma_pagamento: 'dinheiro',
  });

  // Estado inicial: Chama a função para garantir que o ID esteja correto
  const [formData, setFormData] = useState(getInitialState(loggedInBarbeiroId));
  
  // 🚨 CORREÇÃO 2: Ajustar o useEffect para usar a função getInitialState
  useEffect(() => {
    if (movimentacaoData) {
        // Se há dados, preenche o formulário para EDIÇÃO
        setFormData({
            ...movimentacaoData,
            valor: String(movimentacaoData.valor),
            barbeiro_id: loggedInBarbeiroId
        });
    } else {
        // Se não há dados, zera o formulário para CRIAÇÃO
        setFormData(getInitialState(loggedInBarbeiroId));
    }
  }, [movimentacaoData, loggedInBarbeiroId]);

  // Função para atualizar o estado quando o valor de um campo muda
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Função para lidar com o envio (AGORA LIDA COM POST E PUT)
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
  if (!user) {
    ui.showPostIt('Erro: Usuário não logado. Faça o login novamente.', 'error');
    return;
  }

    const dadosParaEnviar = {
        ...formData,
        valor: parseFloat(formData.valor),
        barbeiro_id: loggedInBarbeiroId,
    };

    try {
        const isEditing = !!movimentacaoData;
        
      if (isEditing) {
            // Requisição PUT se estiver editando
            await api.put(`/movimentacoes/${movimentacaoData.id}`, dadosParaEnviar);
        ui.showPostIt('Movimentação atualizada com sucesso!', 'success');
            onCancelEdit(); // Volta o formulário para o modo Criação
        } else {
            // Requisição POST se estiver criando
                await api.post('/movimentacoes', dadosParaEnviar);
                ui.showPostIt('Movimentação adicionada com sucesso!', 'success');
            
            // 🚨 CORREÇÃO: Usar a função getInitialState para resetar
            setFormData(getInitialState(loggedInBarbeiroId));
        }

        // 🚨 AÇÃO CHAVE: Força a recarga da lista e totais no componente pai
        onMovimentacaoAdicionada();
        
      } catch (error) {
      console.error('Erro:', error.response ? error.response.data : error.message);
      ui.showPostIt(`Erro ao salvar movimentação. Status: ${error.response ? error.response.status : 'Network Error'}`, 'error');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px' }}>
      
      {/* O título muda de acordo com o modo */}
      <h2>{movimentacaoData ? 'Editar Movimentação (ID: ' + movimentacaoData.id + ')' : 'Nova Movimentação'}</h2>
      
      <form onSubmit={handleSubmit}>
        
        {/* Campo de Descrição */}
        <label>Descrição:</label>
        <input 
          type="text" 
          name="descricao" 
          value={formData.descricao} 
          onChange={handleChange} 
          required 
        />
        <br/><br/>

        {/* Campo de Valor */}
        <label>Valor (R$):</label>
        <input 
          type="number" 
          name="valor" 
          value={formData.valor} 
          onChange={handleChange} 
          step="0.01" 
          required 
        />
        <br/><br/>

        {/* Campo de Tipo (Receita/Despesa) */}
        <label>Tipo:</label>
        <select name="tipo" value={formData.tipo} onChange={handleChange}>
          <option value="receita">Receita (Entrada)</option>
          <option value="despesa">Despesa (Saída)</option>
        </select>
        <br/><br/>

        {/* Campo de Categoria (Serviço/Produto) */}
        <label>Categoria:</label>
        <select name="categoria" value={formData.categoria} onChange={handleChange}>
          <option value="servico">Serviço</option>
          <option value="produto">Produto</option>
        </select>
        <br/><br/>

        {/* Campo de Forma de Pagamento */}
        <label>Forma de Pagamento:</label>
        <select name="forma_pagamento" value={formData.forma_pagamento} onChange={handleChange}>
          <option value="dinheiro">Dinheiro</option>
          <option value="cartao">Cartão</option>
          <option value="pix">PIX</option>
        </select>
        <br/><br/>

        <button type="submit">{movimentacaoData ? 'Salvar Edição' : 'Adicionar'}</button>
        
        {/* Botão de Cancelar, que só aparece no modo de edição */}
        {movimentacaoData && (
            <button type="button" onClick={onCancelEdit} style={{ marginLeft: '10px' }}>
                Cancelar Edição
            </button>
        )}
      </form>
    </div>
  );
};

export default FormularioMovimentacao;