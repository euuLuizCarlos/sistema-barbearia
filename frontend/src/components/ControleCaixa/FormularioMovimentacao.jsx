// src/components/ControleCaixa/FormularioMovimentacao.jsx (CÓDIGO FINAL MULTI-TENANT)
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext'; // <--- IMPORTAMOS O HOOK DE AUTENTICAÇÃO

// Recebe os dados do item a ser editado (movimentacaoData) e a função de cancelar
const FormularioMovimentacao = ({ onMovimentacaoAdicionada, movimentacaoData, onCancelEdit }) => {
  
  const { user } = useAuth(); // <--- OBTEMOS O USUÁRIO LOGADO
  const loggedInBarbeiroId = user ? user.userId : 0; // Pega o ID do usuário (0 se não logado)

  // Estado inicial com todos os campos necessários
  const [formData, setFormData] = useState({
    barbeiro_id: loggedInBarbeiroId, // <--- USA O ID LOGADO AQUI
    descricao: '',
    valor: '',
    tipo: 'receita', 
    categoria: 'servico', 
    forma_pagamento: 'dinheiro', 
  });
  
  // Efeito que preenche o formulário quando um item é selecionado para edição
  useEffect(() => {
    if (movimentacaoData) {
        // Se há dados, preenche o formulário com o item que veio do App.jsx
        setFormData({
            ...movimentacaoData,
            valor: String(movimentacaoData.valor),
            barbeiro_id: loggedInBarbeiroId // Mantém o ID logado
        });
    } else {
        // Se não há dados, zera o formulário para uma nova criação
        setFormData({
            barbeiro_id: loggedInBarbeiroId, // <--- USA O ID LOGADO AQUI
            descricao: '',
            valor: '',
            tipo: 'receita',
            categoria: 'servico',
            forma_pagamento: 'dinheiro',
        });
    }
  }, [movimentacaoData, loggedInBarbeiroId]); // Adiciona loggedInBarbeiroId como dependência

  // Função para atualizar o estado quando o valor de um campo muda
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Função para lidar com o envio (AGORA LIDA COM POST E PUT)
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    if (!user) { // Proteção extra: não envia se não estiver logado
        alert('Erro: Usuário não logado. Faça o login novamente.');
        return;
    }

    const dadosParaEnviar = {
        ...formData,
        valor: parseFloat(formData.valor),
        barbeiro_id: loggedInBarbeiroId, // Garante que o ID certo está no payload
    };

    try {
        let response;
        const isEditing = !!movimentacaoData;
        
        if (isEditing) {
            // Requisição PUT se estiver editando
            response = await api.put(`/movimentacoes/${movimentacaoData.id}`, dadosParaEnviar);
            alert('Movimentação atualizada com sucesso!');
        } else {
            // Requisição POST se estiver criando
            response = await api.post('/movimentacoes', dadosParaEnviar);
            alert('Movimentação adicionada com sucesso!');
        }

        // Limpa e recarrega após sucesso
        onCancelEdit(); // Zera o formulário
        onMovimentacaoAdicionada(); // Recarrega a lista
        
    } catch (error) {
      console.error('Erro:', error.response ? error.response.data : error.message);
      alert(`Erro ao salvar movimentação. Status: ${error.response ? error.response.status : 'Network Error'}`);
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