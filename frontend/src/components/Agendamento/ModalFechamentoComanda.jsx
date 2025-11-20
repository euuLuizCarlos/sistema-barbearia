// src/components/Agendamento/ModalFechamentoComanda.jsx (VERSÃO SEM COMISSÃO)

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaDollarSign, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

const ModalFechamentoComanda = ({ agendamento, onClose, onFinish }) => {
    
    // O valor Cobrado inicia com o Valor Base do Agendamento
    const [valorCobrado, setValorCobrado] = useState(parseFloat(agendamento.valor_servico || 0));
    const [formaPagamento, setFormaPagamento] = useState('dinheiro');
    
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    // --- Efeito para garantir que o valor inicial seja válido ---
    useEffect(() => {
        if (isNaN(valorCobrado)) {
            setValorCobrado(0);
        }
    }, [valorCobrado]);


    const handleConfirm = async (e) => {
        e.preventDefault();
        setLoading(true);
        setApiError('');

        if (valorCobrado <= 0) {
            setApiError('O valor cobrado deve ser positivo.');
            setLoading(false);
            return;
        }

        try {
            const dataToSubmit = {
                agendamento_id: agendamento.id,
                valor_cobrado: valorCobrado,
                forma_pagamento: formaPagamento,
                // Removida a comissao_percentual
            };
            
            // Chama a rota de fechamento no Backend
            const response = await api.post('/comanda/fechar', dataToSubmit);

            // Sucesso! Chame a função de término que recarrega a lista
            onFinish(response.data.message || "Fechamento realizado com sucesso!");

        } catch (error) {
            console.error("Erro no fechamento:", error);
            setApiError(error.response?.data?.error || 'Erro de conexão/servidor. Verifique o console.');
        } finally {
            setLoading(false);
        }
    };
    
    // Cálculo simples de resumo: 2.5% de taxa de cartão (exemplo de taxa padrão para o resumo)
    const taxaSimulada = formaPagamento === 'cartao' ? 0.025 : 0; 
    const valorLiquidoEstimado = valorCobrado * (1 - taxaSimulada);
    

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
            
            <form onSubmit={handleConfirm} style={{ background: '#fff', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '400px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>

                <h3 style={{ margin: '0 0 20px 0', color: '#023047', borderBottom: '2px solid #FFB703', paddingBottom: '10px' }}>
                    <FaCheck style={{ marginRight: '10px' }} /> Fechar Comanda #{agendamento.id}
                </h3>
                
                <p style={{ fontWeight: 'bold' }}>Cliente: {agendamento.nome_cliente}</p>
                <p style={{ marginBottom: '20px' }}>Serviço: {agendamento.nome_servico} (Base: R$ {parseFloat(agendamento.valor_servico).toFixed(2)})</p>

                {/* CAMPO 1: VALOR COBRADO */}
                <label style={{ display: 'block', marginBottom: '5px' }}>Valor Final Cobrado (R$)</label>
                <input 
                    type="number" 
                    step="0.01" 
                    value={valorCobrado} 
                    onChange={(e) => setValorCobrado(parseFloat(e.target.value))} 
                    required 
                    style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px' }}
                    disabled={loading}
                />

                {/* CAMPO 2: FORMA DE PAGAMENTO */}
                <label style={{ display: 'block', marginBottom: '5px' }}>Formato do Pagamento</label>
                <select 
                    value={formaPagamento} 
                    onChange={(e) => setFormaPagamento(e.target.value)} 
                    style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '5px' }}
                    disabled={loading}
                >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="pix">PIX</option>
                    <option value="outro">Outro</option>
                </select>
                
                {/* RESUMO E ERROS */}
                {apiError && <p style={{ color: 'red', marginBottom: '15px' }}>{apiError}</p>}
                
                <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
                     <p style={{ margin: '5px 0', fontWeight: 'bold', color: 'green' }}>Receita Total (Bruta): R$ {valorCobrado.toFixed(2)}</p>
                     {formaPagamento === 'cartao' && (
                         <p style={{ margin: '5px 0', color: '#cc0000' }}>* Taxa de maquininha será descontada: R$ {(valorCobrado - valorLiquidoEstimado).toFixed(2)}</p>
                     )}
                     <p style={{ margin: '5px 0' }}>**Entrada Líquida no Caixa:** R$ {valorLiquidoEstimado.toFixed(2)}</p>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <button 
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#ccc' : 'green', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', marginBottom: '10px' }}
                >
                    {loading ? <FaSpinner className="spinner" /> : 'Confirmar Fechamento'}
                </button>
                <button 
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
                >
                    <FaTimes style={{ marginRight: '5px' }} /> Cancelar
                </button>
                
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
            </form>
        </div>
    );
};

export default ModalFechamentoComanda;