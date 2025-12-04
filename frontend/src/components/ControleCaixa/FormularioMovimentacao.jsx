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
  const [maquininhas, setMaquininhas] = useState([]);
  const [loadingMaquininhas, setLoadingMaquininhas] = useState(true);

  // Buscar maquininhas ao carregar
  useEffect(() => {
    const fetchMaquininhas = async () => {
      try {
        const response = await api.get('/maquininhas');
        setMaquininhas(response.data.filter(m => m.ativa));
      } catch (error) {
        console.error("Erro ao buscar maquininhas:", error);
      } finally {
        setLoadingMaquininhas(false);
      }
    };
    fetchMaquininhas();
  }, []);  // 🚨 CORREÇÃO 2: Ajustar o useEffect para usar a função getInitialState
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
        maquininha_id: formData.maquininha_id || null,
    };    try {
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

  const COLORS = {
    PRIMARY: '#023047',
    ACCENT: '#FFB703',
    BORDER: '#E0E6ED',
    TEXT: '#1F2937',
    MUTED: '#6B7280',
    BG: '#F7F9FC'
  };

  const cardStyle = {
    background: '#fff',
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '12px',
    padding: '22px 24px',
    marginBottom: '20px',
    boxShadow: '0 8px 24px rgba(2, 48, 71, 0.08)'
  };

  const labelStyle = {
    display: 'block',
    fontWeight: 700,
    color: COLORS.TEXT,
    marginBottom: '6px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 12px',
    borderRadius: '10px',
    border: `1px solid ${COLORS.BORDER}`,
    outline: 'none',
    fontSize: '0.98rem',
    color: COLORS.TEXT,
    background: COLORS.BG,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
  };

  const selectStyle = { ...inputStyle, background: '#fff' };

  const gridTwo = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px'
  };

  const buttonsRow = {
    display: 'flex',
    gap: '10px',
    marginTop: '6px'
  };

  const primaryBtn = {
    flex: 1,
    padding: '12px 14px',
    background: COLORS.PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 6px 14px rgba(2,48,71,0.25)'
  };

  const ghostBtn = {
    flex: 1,
    padding: '12px 14px',
    background: '#fff',
    color: COLORS.TEXT,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer'
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h2 style={{ margin: 0, color: COLORS.PRIMARY }}>
            {movimentacaoData ? `Editar Movimentação #${movimentacaoData.id}` : 'Nova Movimentação'}
          </h2>
          <p style={{ margin: '4px 0 0 0', color: COLORS.MUTED, fontSize: '0.95rem' }}>
            Lance receitas ou despesas e já associe a maquininha de cartão.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div>
          <label style={labelStyle}>Descrição *</label>
          <input
            type="text"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Ex: Corte de cabelo, Compra de produtos"
            style={inputStyle}
            required
          />
        </div>

        <div style={gridTwo}>
          <div>
            <label style={labelStyle}>Valor (R$) *</label>
            <input
              type="number"
              name="valor"
              value={formData.valor}
              onChange={handleChange}
              step="0.01"
              min="0"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Tipo *</label>
            <select name="tipo" value={formData.tipo} onChange={handleChange} style={selectStyle}>
              <option value="receita">Receita (Entrada)</option>
              <option value="despesa">Despesa (Saída)</option>
            </select>
          </div>
        </div>

        <div style={gridTwo}>
          <div>
            <label style={labelStyle}>Categoria *</label>
            <select name="categoria" value={formData.categoria} onChange={handleChange} style={selectStyle}>
              <option value="servico">Serviço</option>
              <option value="produto">Produto</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Forma de Pagamento *</label>
            <select name="forma_pagamento" value={formData.forma_pagamento} onChange={handleChange} style={selectStyle}>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
              <option value="pix">PIX</option>
            </select>
          </div>
        </div>

        {formData.forma_pagamento === 'cartao' && (
          <div>
            <label style={labelStyle}>Maquininha</label>
            {loadingMaquininhas ? (
              <p style={{ color: COLORS.MUTED, margin: '6px 0 0 0' }}>Carregando maquininhas...</p>
            ) : maquininhas.length > 0 ? (
              <select
                name="maquininha_id"
                value={formData.maquininha_id || ''}
                onChange={handleChange}
                style={selectStyle}
              >
                <option value="">Selecione uma maquininha...</option>
                {maquininhas.map(maq => (
                  <option key={maq.id} value={maq.id}>
                    {maq.nome} - {parseFloat(maq.taxa).toFixed(2)}%
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ color: COLORS.MUTED, margin: '6px 0 0 0' }}>
                Nenhuma maquininha ativa. Cadastre em Configurações &gt; Gerenciar Maquininhas.
              </p>
            )}
          </div>
        )}

        <div style={buttonsRow}>
          <button type="submit" style={primaryBtn}>
            {movimentacaoData ? 'Salvar Edição' : 'Adicionar Movimentação'}
          </button>
          {movimentacaoData && (
            <button type="button" onClick={onCancelEdit} style={ghostBtn}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormularioMovimentacao;