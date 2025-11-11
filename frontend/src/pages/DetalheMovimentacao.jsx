// src/pages/DetalheMovimentacao.jsx (NOVO ARQUIVO)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const DetalheMovimentacao = () => {
    // Pega o ID da URL (ex: /transacoes/15)
    const { id } = useParams(); 
    const navigate = useNavigate(); // Hook para voltar à página anterior
    const [movimentacao, setMovimentacao] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDetalhe() {
            setLoading(true);
            try {
                // ATENÇÃO: Seu backend PRECISA ter a rota GET /movimentacoes/:id
                const response = await api.get(`/movimentacoes/${id}`);
                setMovimentacao(response.data);
            } catch (error) {
                console.error(`Erro ao buscar detalhes da movimentação ID ${id}:`, error);
                alert('Movimentação não encontrada ou erro na API.');
                navigate('/transacoes'); // Volta para a lista se falhar
            } finally {
                setLoading(false);
            }
        }
        fetchDetalhe();
    }, [id, navigate]);

    if (loading) {
        return <h1>Carregando Detalhes...</h1>;
    }

    if (!movimentacao) {
        return <h1>Detalhe da Movimentação (ID: {id})</h1>;
    }

    // Formata a data e hora do banco de dados (YYYY-MM-DD HH:MM:SS)
    const dataHora = new Date(movimentacao.data_hora);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR');

    // Estilos básicos para o relatório
    const valueStyle = { fontWeight: 'bold', color: movimentacao.tipo === 'receita' ? 'green' : 'red' };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
            <button onClick={() => navigate('/transacoes')} style={{ marginBottom: '20px' }}>
                &larr; Voltar para a Lista
            </button>

            <h1>Relatório da Movimentação (ID: {movimentacao.id})</h1>
            <hr />

            <div style={{ fontSize: '1.2em', lineHeight: '2.5' }}>
                <p><strong>Descrição:</strong> {movimentacao.descricao}</p>
                
                <p>
                    <strong>Valor:</strong> 
                    <span style={valueStyle}> R$ {parseFloat(movimentacao.valor).toFixed(2)}</span>
                </p>
                
                <p><strong>Tipo:</strong> {movimentacao.tipo === 'receita' ? 'Receita (Entrada)' : 'Despesa (Saída)'}</p>
                <p><strong>Categoria:</strong> {movimentacao.categoria}</p>
                <p><strong>Forma de Pagamento:</strong> {movimentacao.forma_pagamentoo}</p>
                <p><strong>Barbeiro ID:</strong> {movimentacao.barbeiro_id}</p>
                
                <p><strong>Data do Registro:</strong> {dataFormatada}</p>
                <p><strong>Hora do Registro:</strong> {horaFormatada}</p>
            </div>
        </div>
    );
};

export default DetalheMovimentacao;