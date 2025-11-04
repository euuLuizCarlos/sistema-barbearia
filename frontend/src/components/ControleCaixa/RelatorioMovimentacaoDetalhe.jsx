// src/components/ControleCaixa/RelatorioMovimentacaoDetalhe.jsx
import React from 'react';

const RelatorioMovimentacaoDetalhe = ({ movimentacao, onClose }) => {
    
    if (!movimentacao) return null; // Não renderiza se não houver dados

    // Formata a data para exibição
    const dataHora = new Date(movimentacao.data_hora);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Estilo para o valor (Verde para Receita, Vermelho para Despesa)
    const valueStyle = { 
        fontWeight: 'bold', 
        fontSize: '1.4em', 
        color: movimentacao.tipo === 'receita' ? '#00b300' : '#cc0000' 
    };

    // --- ESTILOS PARA O OVERLAY E O MODAL (MINIMALISTA) ---
    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.7)', // Fundo escuro e transparente
        backdropFilter: 'blur(5px)', // Efeito de desfoque
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000 // Garante que fica por cima de tudo
    };

    const modalStyle = {
        background: '#fff',
        padding: '30px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px', // Quadrado/Retângulo centralizado
        boxShadow: '0 0 25px rgba(0, 0, 0, 0.5)',
        color: '#333'
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                
                <h2 style={{ marginBottom: '15px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
                    Detalhes da Movimentação (ID: {movimentacao.id})
                </h2>

                <div style={{ fontSize: '1.1em', lineHeight: '1.8' }}>
                    <p><strong>Descrição:</strong> {movimentacao.descricao}</p>
                    <p>
                        <strong>Valor:</strong> 
                        <span style={valueStyle}> R$ {parseFloat(movimentacao.valor).toFixed(2)}</span>
                    </p>
                    <p><strong>Tipo:</strong> {movimentacao.tipo === 'receita' ? 'Receita' : 'Despesa'}</p>
                    <p><strong>Categoria:</strong> {movimentacao.categoria}</p>
                    <p><strong>Forma de Pagamento:</strong> {movimentacao.forma_pagamento}</p>
                    <p><strong>Barbeiro ID:</strong> {movimentacao.barbeiro_id}</p>
                    
                    <p style={{ marginTop: '15px', fontSize: '0.9em' }}>
                        Registrado em: {dataFormatada} às {horaFormatada}
                    </p>
                </div>

                <button 
                    onClick={onClose} 
                    style={{ 
                        marginTop: '20px', 
                        padding: '10px 20px', 
                        cursor: 'pointer',
                        background: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px'
                    }}
                >
                    Voltar para a Lista
                </button>
            </div>
        </div>
    );
};

export default RelatorioMovimentacaoDetalhe;