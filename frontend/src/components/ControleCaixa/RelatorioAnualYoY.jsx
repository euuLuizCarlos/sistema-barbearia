// src/components/ControleCaixa/RelatorioAnualYoY.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const RelatorioAnualYoY = ({ anoSelecionado }) => {
    const [dadosRelatorio, setDadosRelatorio] = useState(null);
    const [loading, setLoading] = useState(false);

    // Mapeamento de cor e ícone para a diferença de lucro
    const getDiferencaStyle = (percentual) => {
        if (percentual > 0) return { cor: 'green', icone: '▲' };
        if (percentual < 0) return { cor: 'red', icone: '▼' };
        return { cor: '#555', icone: '▬' };
    };
    
    // Função utilitária para calcular o ano anterior
    const calcularAnoAnterior = (ano) => parseInt(ano) - 1;

    // Função principal para buscar o relatório
    const fetchRelatorio = useCallback(async (ano) => {
        if (!ano) return;
        setLoading(true);
        setDadosRelatorio(null);

        const anoAnterior = calcularAnoAnterior(ano);

        try {
            // 1. Busca dados do ano atual
            const responseAtual = await api.get(`/relatorio/anual/${ano}`);
            const dadosAtual = responseAtual.data;

            // 2. Busca dados do ano anterior (pode falhar se for o primeiro ano)
            let dadosAnterior = { receita_total: 0, despesa_total: 0 };
            try {
                const responseAnterior = await api.get(`/relatorio/anual/${anoAnterior}`);
                dadosAnterior = responseAnterior.data;
            } catch (error) {
                // É esperado que a rota retorne {0, 0} ou falhe se não houver dados,
                // mas garantimos um valor seguro aqui
                dadosAnterior = { receita_total: 0, despesa_total: 0 };
            }

            // 3. Cálculos
            const lucroAtual = (dadosAtual.receita_total || 0) - (dadosAtual.despesa_total || 0);
            const lucroAnterior = (dadosAnterior.receita_total || 0) - (dadosAnterior.despesa_total || 0);

            let percentual = 0;
            if (lucroAnterior !== 0) {
                percentual = ((lucroAtual - lucroAnterior) / Math.abs(lucroAnterior)) * 100;
            } else if (lucroAtual > 0) {
                 percentual = 100; // Lucro de 0 para > 0
            } else if (lucroAtual < 0) {
                 percentual = -100; // Lucro de 0 para < 0
            }
            
            const diferencaLucro = {
                percentual: Math.abs(percentual).toFixed(2),
                ...getDiferencaStyle(percentual)
            };


            setDadosRelatorio({
                anoAtualData: dadosAtual,
                anoAnteriorData: dadosAnterior,
                lucroAtual: lucroAtual,
                lucroAnterior: lucroAnterior,
                diferencaLucro: diferencaLucro,
                anoAtual: ano.toString(),
                anoAnterior: anoAnterior.toString(),
            });

        } catch (error) {
            console.error('Erro ao buscar relatório anual YoY:', error);
            // Se der erro 500 no backend, mostramos uma mensagem de erro.
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRelatorio(anoSelecionado);
    }, [anoSelecionado, fetchRelatorio]);


    // --- RENDERIZAÇÃO ---
    if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Carregando Relatório Anual...</div>;
    if (!dadosRelatorio) return <div style={{ textAlign: 'center', padding: '20px' }}>Selecione um ano para visualizar o Relatório Anual.</div>;

    const { diferencaLucro, lucroAtual, anoAnterior, anoAtual } = dadosRelatorio;
    
    // Formatação de valores
    const formatarValor = (valor) => `R$ ${parseFloat(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;


    return (
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px' }}>
                Relatório Anual (Year-over-Year)
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                
                {/* CARD DE LUCRO ATUAL */}
                <div style={{ flex: '1 1 300px', padding: '20px', backgroundColor: '#fff', borderRadius: '6px', borderLeft: `5px solid ${lucroAtual >= 0 ? 'green' : 'red'}` }}>
                    <p style={{ margin: 0, fontSize: '1.2em', color: '#555' }}>Lucro Líquido em {anoAtual}</p>
                    <h4 style={{ margin: '10px 0 0 0', fontSize: '2em', color: lucroAtual >= 0 ? 'green' : 'red' }}>
                        {formatarValor(lucroAtual)}
                    </h4>
                </div>
                
                {/* CARD DE COMPARAÇÃO */}
                <div style={{ flex: '1 1 300px', padding: '20px', backgroundColor: '#fff', borderRadius: '6px', borderLeft: `5px solid ${diferencaLucro.cor}` }}>
                    <p style={{ margin: 0, fontSize: '1.2em', color: '#555' }}>Comparação vs {anoAnterior}</p>
                    <h4 style={{ margin: '10px 0 0 0', fontSize: '2em', color: diferencaLucro.cor }}>
                        {diferencaLucro.icone} {diferencaLucro.percentual}%
                    </h4>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#777' }}>no Lucro Líquido</p>
                </div>

            </div>
            
            {/* O Modal de Detalhes Anual (que não existe) seria chamado aqui */}

        </div>
    );
};

export default RelatorioAnualYoY;