// src/components/ControleCaixa/RelatorioUnificado.jsx (CÓDIGO FINAL E CORRIGIDO)
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import RelatorioMensalMoM from './RelatorioMensalMoM'; 

// Funções Utilitárias (Permanecem as mesmas)
const getDiferencaStyle = (percentual) => {
    if (percentual > 0) return { cor: 'green', icone: '▲' };
    if (percentual < 0) return { cor: 'red', icone: '▼' };
    return { cor: '#555', icone: '▬' };
};

const calcularDiferenca = (atual, anterior) => {
    if (anterior === 0 && atual === 0) return { percentual: 0, icone: '➖', cor: 'gray' };
    if (anterior === 0 && atual !== 0) return { percentual: 100, icone: '▲', cor: 'green' };

    const diferenca = atual - anterior;
    const percentual = (diferenca / Math.abs(anterior)) * 100;
    
    return { 
        percentual: Math.abs(percentual).toFixed(2),
        ...getDiferencaStyle(percentual),
    };
};

const calcularLucroSimples = (dados) => {
    if (!dados) return 0;
    return (parseFloat(dados.receita_total || 0) - parseFloat(dados.despesa_total || 0));
};

// COMPONENTE PRINCIPAL UNIFICADO
const RelatorioUnificado = ({ reportType, dataDiaria, mes, ano, anoAnual, onOpenDetalhe }) => { // <--- RECEBENDO A PROP
    
    const [dadosRelatorio, setDadosRelatorio] = useState(null);
    const [dataComparacao, setDataComparacao] = useState(null); 
    const [loading, setLoading] = useState(false);
    
    // Funções utilitárias para calcular datas
    const calcularMesAnterior = (ano, mes) => {
        let anoAnterior = parseInt(ano);
        let mesAnteriorNum = parseInt(mes) - 1;
        if (mesAnteriorNum === 0) { mesAnteriorNum = 12; anoAnterior -= 1; }
        return { ano: anoAnterior, mes: mesAnteriorNum };
    };

    const calcularDataAnterior = (dataAtualStr) => {
        const data = new Date(dataAtualStr + 'T12:00:00');
        data.setDate(data.getDate() - 1);
        return data.toISOString().split('T')[0];
    };
    
    // FUNÇÃO PRINCIPAL: Buscadora Dinâmica de Dados
    const fetchDados = useCallback(async () => {
        setLoading(true);
        setDadosRelatorio(null);

        let endpoint = '';
        let params = [];
        let endpointAnterior = '';
        
        // 1. Determina o endpoint e os parâmetros baseados no tipo de relatório
        switch (reportType) {
            case 'daily':
                endpoint = '/relatorio/diario/';
                params = [dataDiaria];
                endpointAnterior = `/relatorio/diario/${calcularDataAnterior(dataDiaria)}`;
                break;
            case 'monthly':
                // O componente MoM trata a comparação internamente
                setLoading(false); 
                return;
            case 'annual':
                endpoint = '/relatorio/anual/';
                params = [anoAnual];
                endpointAnterior = `/relatorio/anual/${parseInt(anoAnual) - 1}`;
                break;
            case 'all':
                setLoading(false);
                return;
            default:
                setLoading(false);
                return;
        }
        
        try {
            // Requisição principal
            const [responseAtual, responseAnterior] = await Promise.all([
                api.get(`${endpoint}${params.join('/')}`),
                api.get(endpointAnterior).catch(() => ({ data: { receita_total: 0, despesa_total: 0 } }))
            ]);
            
            setDadosRelatorio(responseAtual.data);
            setDataComparacao(responseAnterior.data);

        } catch (error) {
            console.error(`Erro ao buscar relatório ${reportType}:`, error);
        } finally {
            setLoading(false);
        }
    }, [reportType, dataDiaria, mes, ano, anoAnual]);

    // Chama a função de busca sempre que o tipo de relatório ou a data mudar
    useEffect(() => {
        if (reportType !== 'monthly' && reportType !== 'all') {
            fetchDados();
        }
    }, [fetchDados, reportType]);
    
    
    // --- RENDERIZAÇÃO ---
    const formatarValor = (valor) => `R$ ${parseFloat(valor || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

    // RENDERIZAÇÃO CONDICIONAL BASEADA NO TIPO DE RELATÓRIO
    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando Relatório Dinâmico...</div>;
    }
    
    if (reportType === 'monthly') {
        // REUTILIZA O COMPONENTE MoM
        return (
            <RelatorioMensalMoM 
                anoSelecionado={ano} 
                mesSelecionado={mes} 
                onOpenDetalhe={onOpenDetalhe} // <--- CORREÇÃO FINAL: PASSANDO A PROP CORRETA
                key={`${ano}-${mes}`}
            />
        );
    } 
    
    if (reportType === 'daily' || reportType === 'annual') {
        // Renderização para Relatórios Diários e Anuais (Simples)
        const lucroAtual = calcularLucroSimples(dadosRelatorio);
        const lucroAnterior = calcularLucroSimples(dataComparacao); 
        const diferencaLucro = calcularDiferenca(lucroAtual, lucroAnterior); 

        // Títulos
        const periodoAtual = reportType === 'daily' ? dataDiaria : anoAnual;
        const periodoAnterior = reportType === 'daily' ? calcularDataAnterior(dataDiaria) : parseInt(anoAnual) - 1;


        if (!dadosRelatorio && !loading) {
            return <h3>Nenhum dado encontrado para o período selecionado ({periodoAtual}).</h3>;
        }

        const cardStyle = {
            padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#fff', border: '1px solid #e0e0e0', flex: '1 1 300px'
        };
        const metricStyle = { fontSize: '2em', fontWeight: 'bold', margin: '5px 0' };

        return (
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* CARD DE LUCRO ATUAL */}
                <div style={{...cardStyle, borderLeft: `5px solid ${lucroAtual >= 0 ? 'green' : 'red'}` }}>
                    <h4 style={{ color: '#555' }}>Lucro Líquido ({periodoAtual})</h4>
                    <div style={{...metricStyle, color: lucroAtual >= 0 ? 'green' : 'red'}}>
                        {formatarValor(lucroAtual)}
                    </div>
                </div>
                
                {/* CARD DE RECEITA/DESPESA */}
                <div style={cardStyle}>
                    <h4 style={{ color: '#555' }}>Receita vs Despesa ({periodoAtual})</h4>
                    <p style={{ color: 'blue', fontWeight: 'bold', margin: '5px 0' }}>Receita: {formatarValor(dadosRelatorio.receita_total)}</p>
                    <p style={{ color: 'red', fontWeight: 'bold', margin: '5px 0' }}>Despesa: {formatarValor(dadosRelatorio.despesa_total)}</p>
                </div>
                
                {/* CARD DE COMPARAÇÃO */}
                <div style={{...cardStyle, borderLeft: `5px solid ${diferencaLucro.cor}`}}>
                    <h4 style={{ color: '#555' }}>Comparação YoY/DoD vs {periodoAnterior}</h4>
                    <div style={{...metricStyle, color: diferencaLucro.cor}}>
                        {diferencaLucro.icone} {diferencaLucro.percentual}%
                    </div>
                    <p style={{fontSize: '0.9em', color: '#777', margin: '5px 0 0 0'}}>no Lucro Líquido</p>
                </div>
            </div>
        );
    }

    // Renderização para "Visão Geral Completa"
    if (reportType === 'all') {
        return <h3 style={{ padding: '50px' }}>Esta seção mostraria um gráfico de tendência anual.</h3>;
    }

    return <h3>Selecione um tipo de relatório na barra acima para começar a análise.</h3>;
};

export default RelatorioUnificado;