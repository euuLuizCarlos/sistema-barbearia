// src/components/Agendamento/ModalFechamentoComanda.jsx (CÓDIGO FINAL VERIFICADO)

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaDollarSign, FaCheck, FaTimes, FaSpinner, FaStar } from 'react-icons/fa'; 

// =======================================================
// DEFINIÇÕES DE CORES LOCAIS 
// =======================================================
const COLORS = {
    PRIMARY: '#023047',      
    ACCENT: '#FFB703',       
    SUCCESS: '#4CAF50',      
    ERROR: '#cc0000',        
    SECONDARY_TEXT: '#888888',
};

const ModalFechamentoComanda = ({ agendamento, onClose, onFinish }) => {
    
    const [valorCobrado, setValorCobrado] = useState(parseFloat(agendamento.valor_servico || 0));
    const [formaPagamento, setFormaPagamento] = useState('dinheiro');
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [taxaMaquininha, setTaxaMaquininha] = useState(0);
    const [maquininhas, setMaquininhas] = useState([]);
    const [maquininhaSelecionada, setMaquininhaSelecionada] = useState('');
    
    // ESTADOS PARA A AVALIAÇÃO DO CLIENTE
    // 💡 NOTA: O backend espera TINYINT(1), então mandamos um número.
    const [notaCliente, setNotaCliente] = useState(5); 
    const [obsCliente, setObsCliente] = useState('');
    
    // Buscar maquininhas ao carregar o modal
    useEffect(() => {
        const fetchMaquininhas = async () => {
            try {
                const response = await api.get('/maquininhas');
                const maquinasAtivas = response.data.filter(m => m.ativa);
                setMaquininhas(maquinasAtivas);
                
                // Se houver apenas uma maquininha ativa, seleciona automaticamente
                if (maquinasAtivas.length === 1) {
                    setMaquininhaSelecionada(maquinasAtivas[0].id);
                    setTaxaMaquininha(maquinasAtivas[0].taxa);
                } else if (maquinasAtivas.length > 0) {
                    // Se houver múltiplas, não seleciona automaticamente
                    setMaquininhaSelecionada('');
                    setTaxaMaquininha(0);
                }
            } catch (error) {
                console.error("Erro ao buscar maquininhas:", error);
                // Fallback: busca taxa antiga
                try {
                    const response = await api.get('/taxa-cartao');
                    setTaxaMaquininha(response.data.taxa || 0);
                } catch (e) {
                    setTaxaMaquininha(0);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchMaquininhas();
    }, []);
    
    // Atualizar taxa quando maquininha for selecionada
    useEffect(() => {
        if (maquininhaSelecionada && maquininhas.length > 0) {
            const maq = maquininhas.find(m => m.id === parseInt(maquininhaSelecionada));
            if (maq) {
                setTaxaMaquininha(maq.taxa);
            }
        }
    }, [maquininhaSelecionada, maquininhas]);
    
    // Efeito para garantir que o valor inicial seja válido
    useEffect(() => {
        if (isNaN(valorCobrado)) {
            setValorCobrado(0);
        }
    }, [valorCobrado]);

    // Cálculo da taxa (AGORA USANDO A TAXA REAL DO BARBEIRO)
    const taxaSimulada = formaPagamento === 'cartao' ? (taxaMaquininha / 100) : 0; 
    const valorTaxaEstimado = valorCobrado * taxaSimulada;
    const valorLiquidoEstimado = valorCobrado - valorTaxaEstimado;
    
    // Função auxiliar para renderizar estrelas
    const renderStars = (currentRating) => {
        return [1, 2, 3, 4, 5].map(star => (
            <FaStar 
                key={star} 
                size={24} 
                onClick={() => setNotaCliente(star)} 
                style={{ cursor: 'pointer', color: star <= currentRating ? COLORS.ACCENT : COLORS.SECONDARY_TEXT, transition: 'color 0.2s' }}
            />
        ));
    };

    const handleConfirm = async (e) => {
        e.preventDefault();
        setLoading(true);
        setApiError('');

        if (valorCobrado <= 0 || isNaN(valorCobrado)) {
            setApiError('O valor cobrado deve ser positivo e válido.');
            setLoading(false);
            return;
        }

        try {
            const dataToSubmit = {
                agendamento_id: agendamento.id,
                valor_cobrado: valorCobrado,
                forma_pagamento: formaPagamento,
                maquininha_id: maquininhaSelecionada || null,
                
                // 🚨 GARANTINDO QUE OS VALORES ENVIADOS SÃO CORRETOS 🚨
                avaliacao_cliente_nota: notaCliente, 
                avaliacao_cliente_obs: obsCliente || null // Envia null se vazio, conforme o DB
            };
            
            // Requisição POST para o backend
            const response = await api.post('/comanda/fechar', dataToSubmit);

            onClose(); // Fecha o modal imediatamente após o sucesso
            onFinish(response.data.message || "Fechamento e avaliação realizados com sucesso!");

        } catch (error) {
            console.error("Erro no fechamento (500):", error);
            // Mensagem de erro mais útil se o backend enviar detalhes
            setApiError(error.response?.data?.error || 'Erro interno no servidor (500). Verifique o console do backend.');
            setLoading(false);
        }
    };
    

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }} onClick={onClose}>
            
            <form onSubmit={handleConfirm} onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '400px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>

                <h3 style={{ margin: '0 0 20px 0', color: COLORS.PRIMARY, borderBottom: `2px solid ${COLORS.ACCENT}`, paddingBottom: '10px' }}>
                    <FaCheck style={{ marginRight: '10px' }} /> Fechar Comanda #{agendamento.id}
                </h3>
                
                <p style={{ fontWeight: 'bold' }}>Cliente: {agendamento.nome_cliente}</p>
                <p style={{ marginBottom: '20px' }}>Serviço: {agendamento.nome_servico} (Base: R$ {parseFloat(agendamento.valor_servico).toFixed(2)})</p>

                {/* CAMPO 1: VALOR COBRADO */}
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Valor Final Cobrado (R$)</label>
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Formato do Pagamento</label>
                <select 
                    value={formaPagamento} 
                    onChange={(e) => setFormaPagamento(e.target.value)} 
                    style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px' }}
                    disabled={loading}
                >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="pix">PIX</option>
                    <option value="outro">Outro</option>
                </select>

                {/* CAMPO 3: SELEÇÃO DE MAQUININHA (Só aparece se for cartão) */}
                {formaPagamento === 'cartao' && maquininhas.length > 0 && (
                    <>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Maquininha</label>
                        <select 
                            value={maquininhaSelecionada} 
                            onChange={(e) => setMaquininhaSelecionada(e.target.value)} 
                            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px' }}
                            disabled={loading}
                        >
                            <option value="">Selecione uma maquininha...</option>
                            {maquininhas.map(maq => (
                                <option key={maq.id} value={maq.id}>
                                    {maq.nome} - {parseFloat(maq.taxa).toFixed(2)}%
                                </option>
                            ))}
                        </select>
                    </>
                )}
                
                <hr style={{ margin: '25px 0' }}/>
                
                {/* 🚨 BLOCO DE AVALIAÇÃO DO CLIENTE 🚨 */}
                <div style={{ marginBottom: '25px', padding: '15px', border: `1px solid ${COLORS.ACCENT}`, backgroundColor: '#fff8e6', borderRadius: '5px', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: COLORS.PRIMARY }}>Avaliar Cliente:</h4>
                    
                    {/* Estrelas */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '15px' }}>
                        {renderStars(notaCliente)}
                    </div>
                    
                    {/* Campo de Observação (Opcional) */}
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: COLORS.PRIMARY }}>Observação (Opcional)</label>
                    <textarea
                        rows="2"
                        value={obsCliente}
                        onChange={(e) => setObsCliente(e.target.value)}
                        placeholder="Ex: Cliente pontual e educado."
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px', resize: 'none' }}
                        disabled={loading}
                    />
                </div>
                {/* FIM DO BLOCO DE AVALIAÇÃO */}
                

                {/* RESUMO E ERROS */}
                {apiError && <p style={{ color: COLORS.ERROR, marginBottom: '15px' }}>{apiError}</p>}
                
                <div style={{ background: COLORS.BACKGROUND_LIGHT, padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
                    <p style={{ margin: '5px 0', fontWeight: 'bold', color: COLORS.SUCCESS }}>Receita Bruta: R$ {valorCobrado.toFixed(2)}</p>
                    {formaPagamento === 'cartao' && (
                        <>
                            <p style={{ margin: '5px 0', color: COLORS.ACCENT, fontWeight: 'bold' }}>Taxa de Maquininha ({taxaMaquininha.toFixed(2)}%): R$ {valorTaxaEstimado.toFixed(2)}</p>
                        </>
                    )}
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>**Entrada Líquida:** R$ {valorLiquidoEstimado.toFixed(2)}</p>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <button 
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', backgroundColor: loading ? COLORS.SECONDARY_TEXT : COLORS.SUCCESS, color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', marginBottom: '10px' }}
                >
                    {loading ? <FaSpinner className="spinner" /> : 'Confirmar Fechamento e Avaliar'}
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