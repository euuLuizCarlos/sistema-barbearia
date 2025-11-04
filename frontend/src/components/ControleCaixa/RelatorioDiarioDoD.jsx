// src/components/ControleCaixa/RelatorioDiarioDoD.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const RelatorioDiarioDoD = ({ dataSelecionada }) => {
    const [dadosRelatorio, setDadosRelatorio] = useState(null);
    const [loading, setLoading] = useState(false);

    // Mapeamento de cor e ícone para a diferença de lucro
    const getDiferencaStyle = (percentual) => {
        if (percentual > 0) return { cor: 'green', icone: '▲' };
        if (percentual < 0) return { cor: 'red', icone: '▼' };
        return { cor: '#555', icone: '▬' };
    };

    // Função utilitária para calcular a data de ontem (YYYY-MM-DD)
    const calcularDataAnterior = (dataAtualStr) => {
        const data = new Date(dataAtualStr + 'T12:00:00'); // Garante que a data não sofra com fusos horários
        data.setDate(data.getDate() - 1);
        return data.toISOString().split('T')[0];
    };
    
    // Função principal para buscar o relatório
    const fetchRelatorio = useCallback(async (data) => {
        if (!data) return;
        setLoading(true);
        setDadosRelatorio(null);

        const dataAnterior = calcularDataAnterior(data);

        try {
            // 1. Busca dados do dia atual
            const responseAtual = await api.get(`/relatorio/diario/${data}`);
            const dadosAtual = responseAtual.data;

            // 2. Busca dados do dia anterior (ontem)
            let dadosAnterior = { receita_total: 0, despesa_total: 0 };
            try {
                const responseAnterior = await api.get(`/relatorio/diario/${dataAnterior}`);
                dadosAnterior = responseAnterior.data;
            } catch (error) {
                dadosAnterior = { receita_total: 0, despesa_total: 0 };
            }

            // 3. Cálculos
            const lucroAtual = (dadosAtual.receita_total || 0) - (dadosAtual.despesa_total || 0);
            const lucroAnterior = (dadosAnterior.receita_total || 0) - (dadosAnterior.despesa_total || 0);

            let percentual = 0;
            if (lucroAnterior !== 0) {
                percentual = ((lucroAtual - lucroAnterior) / Math.abs(lucroAnterior)) * 100;
            } else if (lucroAtual > 0) {
                 percentual = 100;
            } else if (lucroAtual < 0) {
                 percentual = -100; 
            }
            
            const diferencaLucro = {
                percentual: Math.abs(percentual).toFixed(2),
                ...getDiferencaStyle(percentual)
            };

            // Formatação da data para exibição
            const formatarData = (dataStr) => new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR');
            
            setDadosRelatorio({
                dataAtualData: dadosAtual,
                dataAnteriorData: dadosAnterior,
                lucroAtual: lucroAtual,
                lucroAnterior: lucroAnterior,
                diferencaLucro: diferencaLucro,
                dataAtual: formatarData(data),
                dataAnterior: formatarData(dataAnterior),
            });

        } catch (error) {
            console.error('Erro ao buscar relatório diário DoD:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRelatorio(dataSelecionada);
    }, [dataSelecionada, fetchRelatorio]);


    // --- RENDERIZAÇÃO ---
    if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Carregando Relatório Diário...</div>;
    if (!dadosRelatorio) return <div style={{ textAlign: 'center', padding: '20px' }}>Selecione uma data para visualizar o Relatório Diário.</div>;

    const { diferencaLucro, lucroAtual, dataAnterior, dataAtual } = dadosRelatorio;
    
    // Formatação de valores
    const formatarValor = (valor) => `R$ ${parseFloat(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;


    return (
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px' }}>
                Relatório Diário (Day-over-Day)
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                
                {/* CARD DE LUCRO ATUAL */}
                <div style={{ flex: '1 1 300px', padding: '20px', backgroundColor: '#fff', borderRadius: '6px', borderLeft: `5px solid ${lucroAtual >= 0 ? 'green' : 'red'}` }}>
                    <p style={{ margin: 0, fontSize: '1.2em', color: '#555' }}>Lucro Líquido em {dataAtual}</p>
                    <h4 style={{ margin: '10px 0 0 0', fontSize: '2em', color: lucroAtual >= 0 ? 'green' : 'red' }}>
                        {formatarValor(lucroAtual)}
                    </h4>
                </div>
                
                {/* CARD DE COMPARAÇÃO */}
                <div style={{ flex: '1 1 300px', padding: '20px', backgroundColor: '#fff', borderRadius: '6px', borderLeft: `5px solid ${diferencaLucro.cor}` }}>
                    <p style={{ margin: 0, fontSize: '1.2em', color: '#555' }}>Comparação vs {dataAnterior}</p>
                    <h4 style={{ margin: '10px 0 0 0', fontSize: '2em', color: diferencaLucro.cor }}>
                        {diferencaLucro.icone} {diferencaLucro.percentual}%
                    </h4>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#777' }}>no Lucro Líquido</p>
                </div>

            </div>
        </div>
    );
};

export default RelatorioDiarioDoD;